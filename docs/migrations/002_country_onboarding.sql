-- Migration: read country from user metadata in handle_new_user trigger.
-- The signup form now sends country in auth metadata; this makes the
-- trigger persist it to tenants.country instead of relying on the default.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_slug text;
  user_country text;
BEGIN
  -- Generate a slug from email prefix + random suffix
  new_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '', 'g'))
              || '-' || SUBSTR(pg_catalog.gen_random_uuid()::text, 1, 6);

  -- Read country from metadata; validate against known codes, fallback VE
  user_country := UPPER(COALESCE(NEW.raw_user_meta_data->>'country', 'VE'));
  IF user_country NOT IN ('VE', 'AR', 'MX', 'CO', 'CL') THEN
    user_country := 'VE';
  END IF;

  INSERT INTO public.tenants (
    owner_id,
    slug,
    business_name,
    country,
    is_approved
  ) VALUES (
    NEW.id,
    new_slug,
    COALESCE(NEW.raw_user_meta_data->>'business_name', SPLIT_PART(NEW.email, '@', 1)),
    user_country,
    false   -- whitelist: manually approve in Supabase dashboard
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
