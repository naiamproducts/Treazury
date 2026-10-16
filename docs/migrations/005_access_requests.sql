-- ============================================================
-- Treazury — Migration 005: access_requests (landing form)
-- ============================================================
-- HOW TO APPLY (operator, Supabase dashboard):
--   1. Open the Supabase dashboard for this project.
--   2. Go to SQL Editor → New query.
--   3. Paste this whole file and press Run.
--   4. Confirm with: SELECT * FROM public.access_requests LIMIT 1;
--      (empty result = table ready; the landing form inserts via anon key)
--
-- WHAT IT DOES:
--   Public "Solicitar acceso" landing form. Anonymous visitors INSERT one
--   row per request; they cannot SELECT/UPDATE/DELETE anything.
--   Authenticated merchants get full access (same convention as the other
--   tables); service_role bypasses RLS regardless.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.access_requests (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  name                 text NOT NULL,
  business_name        text NOT NULL,
  email                text NOT NULL,
  country              text NOT NULL,
  monthly_volume_range text NOT NULL,
  message              text
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Anonymous landing visitors may only create requests.
DROP POLICY IF EXISTS "access_requests_anon_insert" ON public.access_requests;
CREATE POLICY "access_requests_anon_insert" ON public.access_requests
  FOR INSERT TO anon
  WITH CHECK (true);

-- Authenticated users keep full access (same convention as the other tables).
DROP POLICY IF EXISTS "access_requests_authenticated_all" ON public.access_requests;
CREATE POLICY "access_requests_authenticated_all" ON public.access_requests
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
