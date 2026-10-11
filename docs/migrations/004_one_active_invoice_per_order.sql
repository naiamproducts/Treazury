-- ============================================================
-- PayStyle — Migration 004: One active invoice per order
-- Run in Supabase SQL Editor (PayStyle project)
-- ============================================================
--
-- Problem
--   generateInvoiceForOrder() in src/store/index.ts is called on the
--   payment-link transition (updateOrder → pending_payment / invoiced).
--   Retries, double clicks and repeat updates must never produce a second
--   fiscal invoice for the same order. The client checks for an existing
--   non-voided invoice before reserving a number, but that read-then-write
--   has a race window: two concurrent transitions can both see "no invoice"
--   and both insert. Only a database constraint closes that hole.
--
-- Approach
--   A partial unique index on invoices(order_id) that excludes voided rows.
--   Voided invoices stay out of the index on purpose: voiding is the
--   legitimate way to cancel a bad invoice and re-issue, so exactly one
--   non-voided invoice per order is allowed while voided history accumulates.
--   order_id is nullable (SET NULL on order delete); NULLs never conflict in
--   a unique index, so legacy NULL rows are unaffected.
--
-- Pre-check (run before applying — must return zero rows):
--   SELECT order_id, count(*)
--   FROM public.invoices
--   WHERE status <> 'voided' AND order_id IS NOT NULL
--   GROUP BY order_id
--   HAVING count(*) > 1;
--
--   If that returns rows, resolve the duplicates by voiding all but the
--   surviving invoice per order before creating the index.
--
-- Client behavior on conflict
--   A raced insert fails with 23505, which toStoreError() surfaces as a
--   StoreError. The order/payment update that triggered the invoice is
--   already durable and is NOT rolled back; the existing-invoice check on
--   the next read sees the winner. Gaps from the burned fiscal number are
--   normal and auditable (see migration 002).

CREATE UNIQUE INDEX IF NOT EXISTS invoices_one_active_per_order_uidx
  ON public.invoices (order_id)
  WHERE status <> 'voided' AND order_id IS NOT NULL;

COMMENT ON INDEX public.invoices_one_active_per_order_uidx IS
  'At most one non-voided invoice per order. Voided history is excluded so a voided invoice can be re-issued.';
