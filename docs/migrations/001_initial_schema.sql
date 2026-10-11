-- ============================================================
-- PayStyle — Migration 001: Initial Schema
-- Run this in Supabase SQL Editor (paystyle project)
-- ============================================================
-- Requires: Supabase Auth already enabled (default)
-- Extensions needed: pgcrypto (pre-enabled), moddatetime (enable below)
-- ============================================================

-- 0. Enable required extensions
-- -------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE order_status AS ENUM (
  'draft',
  'quoted',
  'confirmed',
  'invoiced',
  'charged',
  'paid',
  'cancelled'
);

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'issued',
  'paid',
  'cancelled',
  'voided'
);

CREATE TYPE charge_status AS ENUM (
  'pending',
  'paid',
  'partial',
  'expired',
  'failed',
  'cancelled'
);

CREATE TYPE member_role AS ENUM (
  'owner',
  'admin',
  'seller',
  'viewer'
);

-- ============================================================
-- 2. HELPER FUNCTION: updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. TENANTS
-- One row per merchant business (= one PayStyle account)
-- ============================================================

CREATE TABLE tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Identity
  slug            text UNIQUE NOT NULL,
  business_name   text NOT NULL,
  logo_url        text,

  -- Access control
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_approved     boolean NOT NULL DEFAULT false,
  approved_at     timestamptz,
  approved_by     uuid REFERENCES auth.users(id),

  -- Payment config
  default_payment_provider  text NOT NULL DEFAULT 'usdc_arc',
  merchant_wallet_id        text,         -- Circle developer-controlled wallet id
  merchant_wallet_address   text,         -- 0x...

  -- Fiscal config
  country         text NOT NULL DEFAULT 'VE',
  tax_id          text,                   -- RIF (VE) / CUIT (AR) / RFC (MX)
  address         text,
  phone           text,
  email           text,
  invoice_prefix  text NOT NULL DEFAULT 'F',
  next_invoice_number  integer NOT NULL DEFAULT 1,
  apply_igtf      boolean NOT NULL DEFAULT true,  -- Venezuela: cobrar IGTF 3%

  -- Flexible fiscal data per country (CAE, PAC config, etc.)
  fiscal_config   jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_owner_all" ON tenants
  FOR ALL USING (owner_id = auth.uid());

-- Approval whitelist is enforced here, not in React: without a column-level
-- REVOKE any merchant self-approves from devtools. Triggers are deliberately
-- NOT used because they also fire for the postgres superuser and would block
-- the documented manual approval step ("DONE" section at the end).
-- Note: SELECT stays open on purpose — a pending merchant must be able to read
-- their own tenant row for the "pending approval" screen to render.
-- Note: `slug` is intentionally absent from the UPDATE grant; the slug is
-- minted at signup and is immutable afterwards.
REVOKE INSERT, UPDATE ON public.tenants FROM authenticated;
GRANT SELECT ON public.tenants TO authenticated;
GRANT UPDATE (
  business_name, logo_url, country, tax_id, address, phone, email,
  invoice_prefix, apply_igtf, fiscal_config,
  merchant_wallet_id, merchant_wallet_address, default_payment_provider,
  next_invoice_number
) ON public.tenants TO authenticated;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- owner_id is unique: the app calls .single() on tenants filtered by owner,
-- which errors if more than one row can match.
ALTER TABLE tenants ADD CONSTRAINT tenants_owner_id_key UNIQUE (owner_id);
-- tenants_owner_id_idx was dropped: the UNIQUE constraint's index is itself a
-- btree on owner_id and already serves every owner_id lookup.
CREATE INDEX tenants_wallet_address_idx ON tenants(merchant_wallet_address)
  WHERE merchant_wallet_address IS NOT NULL;

-- ============================================================
-- 4. TENANT MEMBERS
-- Multiple users per tenant (future: seller accounts)
-- ============================================================

CREATE TABLE tenant_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        member_role NOT NULL DEFAULT 'viewer',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- Members can see the membership list of their own tenants.
-- Scope through `tenants`, never through `tenant_members`: a policy that reads
-- its own table inside USING raises "infinite recursion detected in policy"
-- on every query.
CREATE POLICY "member_tenant_isolation" ON tenant_members
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

CREATE INDEX tenant_members_user_id_idx ON tenant_members(user_id);
CREATE INDEX tenant_members_tenant_id_idx ON tenant_members(tenant_id);

-- ============================================================
-- 5. CONTACTS
-- Buyers / clients of the tenant
-- ============================================================

CREATE TABLE contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  name            text NOT NULL,
  phone           text,            -- E.164: +584121234567
  email           text,
  tax_id          text,            -- RIF del comprador
  address         text,
  notes           text,
  tags            text[] NOT NULL DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Read: tenant isolation (unchanged from the original policy).
CREATE POLICY "contact_tenant_isolation" ON contacts
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Write: tenant isolation AND the tenant is on the approval whitelist.
-- The former FOR ALL policy is narrowed to FOR SELECT on purpose: permissive
-- policies are OR-ed together, so leaving it at FOR ALL would let an unapproved
-- merchant write rows regardless of the policies below.
CREATE POLICY "contact_approved_insert" ON contacts
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = contacts.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "contact_approved_update" ON contacts
  FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = contacts.tenant_id AND t.is_approved
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = contacts.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "contact_approved_delete" ON contacts
  FOR DELETE USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = contacts.tenant_id AND t.is_approved
    )
  );

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX contacts_tenant_id_idx ON contacts(tenant_id);
CREATE INDEX contacts_phone_idx ON contacts(tenant_id, phone);

-- ============================================================
-- 6. PRODUCTS
-- ============================================================

CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  name            text NOT NULL,
  description     text,
  sku             text,
  image_url       text,
  unit            text NOT NULL DEFAULT 'unidad',

  -- Pricing (always in USD / USDC equivalent)
  price           numeric(18,6) NOT NULL CHECK (price >= 0),
  tax_rate        numeric(5,4) NOT NULL DEFAULT 0.16,
  currency        text NOT NULL DEFAULT 'USD',

  -- Stock (null = no stock control)
  stock           integer CHECK (stock >= 0),
  stock_reserved  integer NOT NULL DEFAULT 0 CHECK (stock_reserved >= 0),

  is_active       boolean NOT NULL DEFAULT true,

  -- Flexible product attributes (marca, indice_carga, talla, etc.)
  -- Structure: { fieldDefs: [...], values: {...}, variants: [...] }
  attributes      jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Read: tenant isolation (unchanged from the original policy).
CREATE POLICY "product_tenant_isolation" ON products
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Write: additionally requires an approved tenant (see contacts for why the
-- read policy is narrowed to FOR SELECT).
CREATE POLICY "product_approved_insert" ON products
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = products.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "product_approved_update" ON products
  FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = products.tenant_id AND t.is_approved
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = products.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "product_approved_delete" ON products
  FOR DELETE USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = products.tenant_id AND t.is_approved
    )
  );

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX products_tenant_id_idx ON products(tenant_id);
CREATE INDEX products_sku_idx ON products(tenant_id, sku) WHERE sku IS NOT NULL;

-- ============================================================
-- 7. ORDERS
-- ============================================================

CREATE TABLE orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id      uuid REFERENCES contacts(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  order_number    text NOT NULL,                    -- e.g. ORD-0001
  status          order_status NOT NULL DEFAULT 'draft',

  -- Denormalized totals (recalculated on order_lines change)
  subtotal        numeric(18,6) NOT NULL DEFAULT 0,
  tax_amount      numeric(18,6) NOT NULL DEFAULT 0,
  igtf_amount     numeric(18,6) NOT NULL DEFAULT 0,
  total           numeric(18,6) NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'USD',

  -- Buyer info (snapshot at order time, separate from contact)
  buyer_name      text,
  buyer_phone     text,
  buyer_tax_id    text,

  notes           text,
  source          text NOT NULL DEFAULT 'dashboard',  -- 'dashboard' | 'whatsapp' | 'api'
  whatsapp_thread_id  text
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Read: tenant isolation (unchanged from the original policy).
CREATE POLICY "order_tenant_isolation" ON orders
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Write: additionally requires an approved tenant (see contacts for why the
-- read policy is narrowed to FOR SELECT).
CREATE POLICY "order_approved_insert" ON orders
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = orders.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "order_approved_update" ON orders
  FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = orders.tenant_id AND t.is_approved
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = orders.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "order_approved_delete" ON orders
  FOR DELETE USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = orders.tenant_id AND t.is_approved
    )
  );

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX orders_tenant_id_idx ON orders(tenant_id);
CREATE INDEX orders_status_idx ON orders(tenant_id, status);
CREATE INDEX orders_contact_id_idx ON orders(contact_id);

-- Fiscal numbering cannot collide within a tenant (cross-tenant duplicates are
-- legal: two merchants may both use ORD-0001).
ALTER TABLE orders ADD CONSTRAINT orders_tenant_number_key UNIQUE (tenant_id, order_number);

-- ============================================================
-- 8. ORDER LINES
-- ============================================================

CREATE TABLE order_lines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Snapshot of product at order time
  description     text NOT NULL,
  unit            text,
  quantity        numeric(18,6) NOT NULL CHECK (quantity > 0),
  unit_price      numeric(18,6) NOT NULL CHECK (unit_price >= 0),
  tax_rate        numeric(5,4) NOT NULL DEFAULT 0.16,
  line_total      numeric(18,6) NOT NULL,   -- quantity * unit_price

  -- Optional: track variant
  variant_label   text
);

ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;

-- order_lines has no tenant_id; scope through the parent order.
-- RLS is per-table and does not cascade from orders, and Supabase's default
-- privileges grant anon/authenticated on every table in public — the anon key
-- ships in the browser bundle, so without this the whole B2B price book
-- (description, quantity, unit_price, line_total) is world-readable.
-- Narrowed to FOR SELECT so the approved-write policies below are not OR-ed
-- away by a FOR ALL policy (see contacts).
CREATE POLICY "order_line_tenant_isolation" ON order_lines
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    )
  );

-- Write: approval is checked on the parent order's tenant.
CREATE POLICY "order_line_approved_insert" ON order_lines
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM tenants t WHERE t.id = o.tenant_id AND t.is_approved
        )
    )
  );

CREATE POLICY "order_line_approved_update" ON order_lines
  FOR UPDATE
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM tenants t WHERE t.id = o.tenant_id AND t.is_approved
        )
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM tenants t WHERE t.id = o.tenant_id AND t.is_approved
        )
    )
  );

CREATE POLICY "order_line_approved_delete" ON order_lines
  FOR DELETE USING (
    order_id IN (
      SELECT o.id FROM orders o
      WHERE o.tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM tenants t WHERE t.id = o.tenant_id AND t.is_approved
        )
    )
  );

CREATE INDEX order_lines_order_id_idx ON order_lines(order_id);
-- Every other FK is indexed; this one was missing, so ON DELETE SET NULL
-- from products seq-scanned order_lines.
CREATE INDEX order_lines_product_id_idx ON order_lines(product_id);

-- ============================================================
-- 9. CHARGES
-- Payment link per order (one active charge per order at a time)
-- ============================================================

CREATE TABLE charges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id            uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- Payment provider
  payment_provider    text NOT NULL DEFAULT 'usdc_arc',
  provider_ref        text,             -- internal provider id

  -- Amount
  amount              numeric(18,6) NOT NULL CHECK (amount > 0),
  amount_received     numeric(18,6) NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'USD',

  -- Onchain vault (usdc_arc provider)
  vault_address       text,             -- OrderVault CREATE2 address
  charge_id_onchain   text,             -- bytes32 chargeId passed to contract

  -- Shared link
  payment_url         text NOT NULL,
  expires_at          timestamptz,

  -- Status
  status              charge_status NOT NULL DEFAULT 'pending',
  paid_at             timestamptz,

  -- Onchain confirmation
  tx_hash             text,
  block_number        bigint,
  sweep_tx_hash       text,             -- OrderVault._sweep tx

  memo                text
);

ALTER TABLE charges ENABLE ROW LEVEL SECURITY;

-- Read: tenant isolation (unchanged from the original policy).
CREATE POLICY "charge_tenant_isolation" ON charges
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Write: additionally requires an approved tenant (see contacts for why the
-- read policy is narrowed to FOR SELECT).
CREATE POLICY "charge_approved_insert" ON charges
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = charges.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "charge_approved_update" ON charges
  FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = charges.tenant_id AND t.is_approved
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = charges.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "charge_approved_delete" ON charges
  FOR DELETE USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = charges.tenant_id AND t.is_approved
    )
  );

CREATE TRIGGER charges_updated_at
  BEFORE UPDATE ON charges
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX charges_tenant_id_idx ON charges(tenant_id);
CREATE INDEX charges_order_id_idx ON charges(order_id);
CREATE INDEX charges_status_idx ON charges(tenant_id, status);
CREATE INDEX charges_tx_hash_idx ON charges(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX charges_vault_address_idx ON charges(vault_address)
  WHERE vault_address IS NOT NULL;

-- Enforces the "one active charge per order at a time" invariant stated in the
-- section header, which nothing previously guaranteed. order_id is nullable and
-- PostgreSQL treats NULLs as distinct, so order-less charges are unaffected.
CREATE UNIQUE INDEX charges_active_order_uidx ON charges(order_id) WHERE status IN ('pending', 'partial');

-- ============================================================
-- 10. PAYMENTS
-- Immutable record of each received payment event
-- ============================================================

CREATE TABLE payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  charge_id           uuid NOT NULL REFERENCES charges(id) ON DELETE CASCADE,
  created_at          timestamptz NOT NULL DEFAULT now(),

  amount              numeric(18,6) NOT NULL,
  currency            text NOT NULL DEFAULT 'USD',
  payment_provider    text NOT NULL,
  provider_ref        text NOT NULL,    -- tx hash, external payment id, etc.
  paid_at             timestamptz NOT NULL,

  -- Onchain details
  tx_hash             text,
  from_address        text,
  block_number        bigint,
  chain_id            integer,

  -- Fee breakdown (from OrderVault._sweep)
  platform_fee        numeric(18,6),
  dev_fee             numeric(18,6),
  merchant_amount     numeric(18,6),

  -- Raw webhook / onchain event (for audit & reprocessing)
  raw_event           jsonb
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Read: tenant isolation (unchanged from the original policy).
CREATE POLICY "payment_tenant_isolation" ON payments
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Write: additionally requires an approved tenant (see contacts for why the
-- read policy is narrowed to FOR SELECT).
-- Webhook ingestion runs as service_role, which bypasses RLS, so Circle
-- callbacks are unaffected by this gate.
CREATE POLICY "payment_approved_insert" ON payments
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = payments.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "payment_approved_update" ON payments
  FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = payments.tenant_id AND t.is_approved
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = payments.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "payment_approved_delete" ON payments
  FOR DELETE USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = payments.tenant_id AND t.is_approved
    )
  );

CREATE INDEX payments_tenant_id_idx ON payments(tenant_id);
CREATE INDEX payments_charge_id_idx ON payments(charge_id);

-- Webhook replay protection: Circle retries routinely and a replayed event
-- would otherwise insert a second ledger row and double-count aggregates.
-- Composite, NOT global: PaymentProvider is a pluggable interface (Circle now,
-- Santander Pay / Mercado Pago later). Two providers may legitimately emit the
-- same ref; a global unique index would break in production mid-payment.
CREATE UNIQUE INDEX payments_provider_ref_uidx ON payments(payment_provider, provider_ref);

-- ============================================================
-- 11. INVOICES
-- ============================================================

CREATE TABLE invoices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id            uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  invoice_number      text NOT NULL,   -- F-000001
  status              invoice_status NOT NULL DEFAULT 'draft',
  issued_at           timestamptz,

  -- Immutable snapshots at issue time
  tenant_snapshot     jsonb NOT NULL DEFAULT '{}'::jsonb,
  buyer_snapshot      jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Totals
  subtotal            numeric(18,6),
  tax_amount          numeric(18,6),
  igtf_amount         numeric(18,6),
  total               numeric(18,6),
  currency            text NOT NULL DEFAULT 'USD',

  -- Venezuela
  numero_control      text,

  -- Other countries
  fiscal_data         jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Assets (Supabase Storage URLs)
  pdf_url             text,
  xml_url             text
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Read: tenant isolation (unchanged from the original policy).
CREATE POLICY "invoice_tenant_isolation" ON invoices
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Write: additionally requires an approved tenant (see contacts for why the
-- read policy is narrowed to FOR SELECT).
CREATE POLICY "invoice_approved_insert" ON invoices
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = invoices.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "invoice_approved_update" ON invoices
  FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = invoices.tenant_id AND t.is_approved
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = invoices.tenant_id AND t.is_approved
    )
  );

CREATE POLICY "invoice_approved_delete" ON invoices
  FOR DELETE USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM tenants t WHERE t.id = invoices.tenant_id AND t.is_approved
    )
  );

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX invoices_tenant_id_idx ON invoices(tenant_id);
CREATE INDEX invoices_order_id_idx ON invoices(order_id);

-- Fiscal numbering cannot collide within a tenant (cross-tenant duplicates are
-- legal: two merchants may both use F-000001).
ALTER TABLE invoices ADD CONSTRAINT invoices_tenant_number_key UNIQUE (tenant_id, invoice_number);

-- ============================================================
-- 12. HELPER FUNCTION: auto-create tenant on user signup
-- This function fires after a new auth.users row is inserted.
-- It creates a tenant record with is_approved = false (whitelist).
-- Set is_approved = true manually in the dashboard for now.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_slug text;
BEGIN
  -- Generate a slug from email prefix + random suffix
  -- gen_random_uuid() is qualified: core since PG13, so it resolves with an
  -- empty search_path regardless of where pgcrypto lives.
  new_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '', 'g'))
              || '-' || SUBSTR(pg_catalog.gen_random_uuid()::text, 1, 6);

  INSERT INTO public.tenants (
    owner_id,
    slug,
    business_name,
    is_approved
  ) VALUES (
    NEW.id,
    new_slug,
    COALESCE(NEW.raw_user_meta_data->>'business_name', SPLIT_PART(NEW.email, '@', 1)),
    false   -- whitelist: manually approve in Supabase dashboard
  );

  RETURN NEW;
END;
-- SECURITY DEFINER with an empty search_path: the function runs as the table
-- owner and must not resolve unqualified names through an attacker-writable
-- schema. public.tenants is already schema-qualified; pg_catalog is always
-- searched implicitly, so REGEXP_REPLACE/SPLIT_PART/SUBSTR/LOWER still bind.
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- DONE
-- Next steps:
-- 1. Enable Email auth in Supabase Auth settings
-- 2. Disable "Confirm email" for local dev (Auth > Settings > Disable email confirmation)
--    Re-enable before going live.
-- 3. To approve a user: UPDATE tenants SET is_approved = true WHERE owner_id = '<user_uuid>';
-- ============================================================
