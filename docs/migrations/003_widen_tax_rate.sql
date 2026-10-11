-- ============================================================
-- PayStyle — Migration 003: Widen tax_rate to hold a percentage
-- Run in Supabase SQL Editor (PayStyle project)
-- ============================================================
--
-- Problem
--   products.tax_rate and order_lines.tax_rate were numeric(5,4), capping at
--   9.9999.
--
-- Correcting an earlier diagnosis: this migration was originally written as a
-- critical bug fix, on the assumption that the rate is stored as a percentage
-- (16 for IVA, 3 for IGTF), which would overflow the column:
--
--   ERROR: 22003 numeric field overflow
--
-- That overflow was real, but it was produced by a hand-written test that wrote
-- 16. The application never does. tax_rate is a FRACTION: the column default is
-- 0.16 and src/store/mappers.ts deliberately omits the field so that default
-- applies. numeric(5,4) held fractions comfortably, so no application write was
-- ever failing. There was no bug to fix.
--
-- What this migration actually does
--   Adds headroom. 0.16 needs 4 decimal places to stay exact, and a
--   scale-limited column makes precision harder to reason about as the schema
--   grows. The values are unchanged — no rescale, and no existing row is
--   touched.
--
-- Convention, stated because it is genuinely easy to get wrong
--   tax_rate is a fraction, not a percentage: Venezuela's 16% IVA is stored as
--   0.16 and its 3% IGTF as 0.03. If you ever write 16 here you will overflow a
--   numeric(7,4) column too, and the arithmetic downstream will silently be off
--   by 100x.

ALTER TABLE public.products
  ALTER COLUMN tax_rate TYPE numeric(7,4);

ALTER TABLE public.order_lines
  ALTER COLUMN tax_rate TYPE numeric(7,4);
