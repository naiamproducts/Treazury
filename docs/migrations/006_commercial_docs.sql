-- ============================================================
-- Treazury — Migration 006: commercial docs + partner attribution
-- Run in Supabase SQL Editor (operator applies; never executed by CI)
-- ============================================================
-- import-export-pivot, slice 1. Three sections:
--   1. commercial_docs — non-fiscal commercial invoice / packing list
--      snapshots with their own numbering (design D2/D8).
--   2. next_commercial_doc_number() — own sequence (design D4, CD-R6).
--   3. Partner attribution RPCs — attribute_signup / partner_panel_stats
--      (design D9/D10, PA-R1..R3).
--
-- Guardrails:
--   * The fiscal sequence (next_invoice_number) is never read or written
--     here — commercial docs cannot consume or alter fiscal numbers (CD-R6).
--   * RLS follows the member_tenant_isolation pattern from migration 001:
--     scope through tenants.owner_id = auth.uid(), never through a policy
--     reading its own table inside USING (infinite recursion).
--   * No fund-holding or custody structures: settlement stays direct
--     buyer -> seller (PA-R5).
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Schema: enums, columns, commercial_docs
-- ─────────────────────────────────────────────

CREATE TYPE commercial_doc_status AS ENUM ('draft', 'released', 'voided');
CREATE TYPE commercial_doc_type AS ENUM ('commercial_invoice', 'packing_list');

-- Customs / logistics fields on the product catalog (design D8). Nullable so
-- existing rows keep working; values are copied into commercial_docs.lines at
-- draft generation, after which edits are doc-local overrides. `unit` already
-- exists on products and order_lines.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS hs_code text,             -- HS tariff code
  ADD COLUMN IF NOT EXISTS country_of_origin text,    -- ISO 3166-1 alpha-2
  ADD COLUMN IF NOT EXISTS weight_net_kg numeric(12,3),
  ADD COLUMN IF NOT EXISTS weight_gross numeric(12,3),
  ADD COLUMN IF NOT EXISTS packages integer;

-- Partner attribution (PA-R1): which partner tenant referred this tenant's
-- signup. ON DELETE SET NULL: the attribution is reporting-only metadata.
ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS attributed_partner_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Writes to attributed_partner_tenant_id flow exclusively through the
-- SECURITY DEFINER attribute_signup RPC below (once-only + approved-partner
-- checks). Mirror the tenants lockdown from 001: revoke table-level writes
-- so a tenant owner cannot re-attribute via PostgREST UPDATE; SELECT remains
-- readable for the partner panel.
REVOKE INSERT, UPDATE ON public.tenant_members FROM anon, authenticated;
GRANT SELECT ON public.tenant_members TO authenticated;

CREATE INDEX IF NOT EXISTS tenant_members_attributed_partner_idx
  ON public.tenant_members (attributed_partner_tenant_id)
  WHERE attributed_partner_tenant_id IS NOT NULL;

-- Partner commission config (PA-R2): basis points of settled volume.
-- NULL = not configured; the app falls back to its default (design D9).
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS partner_fee_bps integer;

CREATE TABLE public.commercial_docs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  doc_type        commercial_doc_type NOT NULL,
  doc_number      integer NOT NULL,               -- sequence value; rendered 'CD-00001'
  status          commercial_doc_status NOT NULL DEFAULT 'draft',
  released_at     timestamptz,

  -- Header (Incoterm is header-level; line fields live in `lines` jsonb)
  incoterm        text,
  currency        text NOT NULL DEFAULT 'USD',
  seller_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  buyer_snapshot  jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Line snapshot: one object per order line (description, quantity, prices,
  -- hsCode, origin, weightNetKg, weightGrossKg, packages — design D8/D11)
  lines           jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Document-level totals (weights/packages totalled at document level)
  weight_net_kg   numeric(12,3),
  weight_gross    numeric(12,3),
  packages_total  integer,

  -- Reserved for a future server-side renderer (design D1); unused in MVP.
  pdf_path        text
);

ALTER TABLE public.commercial_docs ENABLE ROW LEVEL SECURITY;

-- Same uniqueness rule as fiscal invoices (001): cross-tenant duplicates are
-- legal; doc numbers cannot collide within a tenant.
ALTER TABLE public.commercial_docs
  ADD CONSTRAINT commercial_docs_tenant_number_key UNIQUE (tenant_id, doc_number);

-- At most one non-voided doc per (tenant, order, type) — closes the race
-- between two concurrent draft generations (mirrors migration 004: voided
-- rows stay out of the index so a bad doc can be voided and re-issued;
-- NULL order_id never conflicts in a unique index either way).
CREATE UNIQUE INDEX commercial_docs_one_active_per_type_uidx
  ON public.commercial_docs (tenant_id, order_id, doc_type)
  WHERE status <> 'voided' AND order_id IS NOT NULL;

CREATE TRIGGER commercial_docs_updated_at
  BEFORE UPDATE ON public.commercial_docs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Split-policy pattern (migration 001, invoices): reads are scoped to the
-- owning tenant (CD-R7: cross-tenant reads return no rows); writes
-- additionally require an approved tenant, so an unapproved tenant cannot
-- insert/update/delete commercial docs directly and must go through the
-- approved RPC path (next_commercial_doc_number already gates on approval).
CREATE POLICY "commercial_doc_tenant_isolation" ON public.commercial_docs
  FOR SELECT
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "commercial_doc_approved_insert" ON public.commercial_docs
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.tenants t WHERE t.id = commercial_docs.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "commercial_doc_approved_update" ON public.commercial_docs
  FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.tenants t WHERE t.id = commercial_docs.tenant_id AND t.is_approved
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.tenants t WHERE t.id = commercial_docs.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "commercial_doc_approved_delete" ON public.commercial_docs
  FOR DELETE USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.tenants t WHERE t.id = commercial_docs.tenant_id AND t.is_approved
    )
  );

-- ─────────────────────────────────────────────
-- 2. Commercial doc numbering (design D4, CD-R6)
-- ─────────────────────────────────────────────
-- Mirror of migration 002's next_invoice_number(), including the burn-on-
-- failure property: a failed commercial_docs insert consumes a number —
-- gaps are auditable, duplicates are not. The fiscal sequence is a separate
-- column and is never read or written by this function or this file.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS next_commercial_doc_number integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.next_commercial_doc_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_no integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE owner_id = (SELECT auth.uid()) AND is_approved
  ) THEN
    RAISE EXCEPTION 'Treazury: tenant is not approved or does not exist'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.tenants
  SET next_commercial_doc_number = next_commercial_doc_number + 1
  WHERE owner_id = (SELECT auth.uid())
  RETURNING next_commercial_doc_number INTO next_no;

  IF next_no IS NULL THEN
    RAISE EXCEPTION 'Treazury: no tenant found for the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  RETURN next_no;
END;
$$;

COMMENT ON FUNCTION public.next_commercial_doc_number() IS
  'Atomically reserves and returns the next commercial doc number for the caller''s tenant. Separate from the fiscal invoice sequence.';

-- SECURITY DEFINER defaults to EXECUTE for PUBLIC. Lock it to authenticated.
REVOKE ALL ON FUNCTION public.next_commercial_doc_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_commercial_doc_number() TO authenticated;

-- ─────────────────────────────────────────────
-- 3. Partner attribution RPCs (design D9/D10, PA-R1..R3)
-- ─────────────────────────────────────────────
-- Both are SECURITY DEFINER so they can read across tenants for exactly two
-- bounded purposes: attribute_signup writes only the CALLER'S OWN membership
-- row, and partner_panel_stats returns aggregates only. Existing RLS policies
-- are not dropped, relaxed, or redefined anywhere in this file.

CREATE OR REPLACE FUNCTION public.attribute_signup(p_partner uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_own_tenant uuid;
  v_updated integer;
BEGIN
  SELECT id INTO v_own_tenant
  FROM public.tenants
  WHERE owner_id = (SELECT auth.uid());

  IF v_own_tenant IS NULL THEN
    RAISE EXCEPTION 'Treazury: no tenant found for the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  -- No attribution ref: no-op, attribution stays null and signup proceeds
  -- normally (PA-R1S2).
  IF p_partner IS NULL THEN
    RETURN false;
  END IF;

  -- Partner must be a different, approved tenant (design D10).
  IF p_partner = v_own_tenant
     OR NOT EXISTS (
       SELECT 1 FROM public.tenants
       WHERE id = p_partner AND is_approved
     )
  THEN
    RAISE EXCEPTION 'Treazury: invalid partner reference'
      USING ERRCODE = '42501';
  END IF;

  -- Once-only (PA-R1S1): an existing attribution is never overwritten.
  UPDATE public.tenant_members
  SET attributed_partner_tenant_id = p_partner
  WHERE tenant_id = v_own_tenant
    AND user_id = (SELECT auth.uid())
    AND attributed_partner_tenant_id IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

COMMENT ON FUNCTION public.attribute_signup(uuid) IS
  'Records the caller''s signup attribution to an approved partner tenant. Once-only; writes only the caller''s own membership row.';

REVOKE ALL ON FUNCTION public.attribute_signup(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attribute_signup(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.partner_panel_stats()
RETURNS TABLE (
  attributed_signups bigint,
  settled_volume     numeric,
  fee_bps            integer,
  commission         numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_partner uuid;
  v_signups bigint;
  v_volume  numeric;
  v_bps     integer;
BEGIN
  SELECT id INTO v_partner
  FROM public.tenants
  WHERE owner_id = (SELECT auth.uid());

  IF v_partner IS NULL THEN
    RAISE EXCEPTION 'Treazury: no tenant found for the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  -- Attributed signup count (PA-R3).
  SELECT count(*) INTO v_signups
  FROM public.tenant_members
  WHERE attributed_partner_tenant_id = v_partner;

  -- Settled volume: every payment received by attributed tenants. Payments
  -- are rows only for money actually received, so pending charges never
  -- count (PA-R3). Zeros when there is nothing yet (PA-R3S2).
  SELECT COALESCE(sum(p.amount), 0) INTO v_volume
  FROM public.payments p
  WHERE p.tenant_id IN (
    SELECT tm.tenant_id
    FROM public.tenant_members tm
    WHERE tm.attributed_partner_tenant_id = v_partner
  );

  -- Commission = settled volume x fee (basis points). 100 bps = 1% default
  -- when the tenant has no configured rate (design D9, PA-R2).
  SELECT COALESCE(t.partner_fee_bps, 100) INTO v_bps
  FROM public.tenants t
  WHERE t.id = v_partner;

  RETURN QUERY SELECT v_signups, v_volume, v_bps, round(v_volume * v_bps / 10000.0, 6);
END;
$$;

COMMENT ON FUNCTION public.partner_panel_stats() IS
  'Partner tenant panel aggregates: attributed signups, settled volume, fee bps, accrued commission. Aggregates only — no attributed-tenant row access.';

REVOKE ALL ON FUNCTION public.partner_panel_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.partner_panel_stats() TO authenticated;
