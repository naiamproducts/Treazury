-- ============================================================
-- PayStyle — Migration 003: Widen tax_rate to hold a percentage
-- Run in Supabase SQL Editor (PayStyle project)
-- ============================================================
--
-- Problem
--   products.tax_rate and order_lines.tax_rate are numeric(5,4), which caps at
--   9.9999. The launch market is Venezuela: IVA is 16% and IGTF is 3%. Writing
--   the rate as a percentage overflows the column:
--
--     ERROR: 22003 numeric field overflow
--     DETAIL: A field with precision 5, scale 4 must round to an absolute
--             value less than 10^1.
--
--   This is not a rounding nuisance — every insert of a taxed line fails.
--
-- Fix
--   numeric(7,4) holds up to 999.9999, covering IVA, IGTF and any future rate
--   while keeping 4 decimal places.
--
--   Deliberately NOT rescaling existing values. The column was unusable at
--   its current width, so no real percentage could have been stored; any rows
--   present hold a fraction or zero and are left untouched. The rate is stored
--   as a percentage (16, not 0.16) — documented here because that convention
--   is the thing a future contributor is most likely to get wrong.

ALTER TABLE public.products
  ALTER COLUMN tax_rate TYPE numeric(7,4);

ALTER TABLE public.order_lines
  ALTER COLUMN tax_rate TYPE numeric(7,4);
