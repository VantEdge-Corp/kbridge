-- =====================================================
-- Lineage — Signup Flow Helper
-- Run AFTER 001 and 002 in the Supabase SQL Editor.
--
-- The /signup/:token route needs to know the email and first
-- name that belong to a status_token, but ONLY when that
-- application is approved. We keep this in a SECURITY DEFINER
-- RPC so anon callers can read just enough to render the
-- signup form, without granting wider read access to the
-- applications table.
-- =====================================================

create or replace function public.get_application_for_signup(p_token text)
returns table (email text, first_name text, status text)
language sql
security definer
set search_path = public
as $$
  select email, first_name, status
  from public.applications
  where status_token = p_token
    and status = 'approved'
  limit 1;
$$;

revoke all on function public.get_application_for_signup(text) from public;
grant execute on function public.get_application_for_signup(text) to anon, authenticated;
