-- ============================================================
-- PayStyle — Migration 002: Atomic invoice numbering
-- Run in Supabase SQL Editor (PayStyle project)
-- ============================================================
--
-- Problem
--   tenants.next_invoice_number is a plain integer column with nothing
--   serializing concurrent increments. Two invoices created at the same
--   moment read the same value and one insert loses to the
--   UNIQUE (tenant_id, invoice_number) constraint added in migration 001.
--   A client-side read-then-write has the same race with a wider window.
--
-- Approach
--   A single UPDATE ... RETURNING is atomic in Postgres: the row is locked
--   for the duration of the statement and the value returned is the one that
--   was written. Exposing it as a function keeps callers from reimplementing
--   the read-modify-write.
--
--   The function takes no tenant argument on purpose. Deriving the tenant from
--   auth.uid() means a caller cannot request a number for someone else's
--   tenant by passing a different id.
--
--   Consequence: a failed invoice insert burns a number. That is intentional.
--   Gaps in fiscal numbering are normal and auditable; duplicate numbers are
--   not, and are what the constraint exists to prevent.

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_no integer;
BEGIN
  -- Mirror the write gate applied to business tables in migration 001: an
  -- unapproved tenant must not be able to consume the sequence.
  IF NOT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE owner_id = (SELECT auth.uid()) AND is_approved
  ) THEN
    RAISE EXCEPTION 'PayStyle: tenant is not approved or does not exist'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.tenants
  SET next_invoice_number = next_invoice_number + 1
  WHERE owner_id = (SELECT auth.uid())
  RETURNING next_invoice_number INTO next_no;

  IF next_no IS NULL THEN
    RAISE EXCEPTION 'PayStyle: no tenant found for the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  RETURN next_no;
END;
$$;

COMMENT ON FUNCTION public.next_invoice_number() IS
  'Atomically reserves and returns the next invoice number for the caller''s tenant.';

-- SECURITY DEFINER defaults to EXECUTE for PUBLIC. Lock it to authenticated.
REVOKE ALL ON FUNCTION public.next_invoice_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_invoice_number() TO authenticated;
