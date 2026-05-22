-- =====================================================
-- Lineage — RLS Recursion Fix
-- Run this in the Supabase SQL Editor AFTER 001, 002, 003.
--
-- The admin policies in migration 002 used
--   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()
--           AND is_admin = true)
-- as their admin check. When that pattern appears in a policy ON
-- public.profiles, Postgres evaluates the inner SELECT under the
-- same RLS — which re-enters the same policy. Infinite recursion.
--
-- It also affects the applications policies indirectly: every
-- inner SELECT against profiles triggers the recursive profiles
-- policy too.
--
-- The fix is to do the admin lookup inside a SECURITY DEFINER
-- function, which runs as the function owner and bypasses RLS
-- on the inner query.
-- =====================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ── Rewrite the three offending policies ─────────────────

-- profiles
drop policy if exists "admins_read_all_profiles" on public.profiles;
create policy "admins_read_all_profiles" on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- applications (read)
drop policy if exists "admins_read_applications" on public.applications;
create policy "admins_read_applications" on public.applications
  for select
  to authenticated
  using (public.is_admin());

-- applications (update)
drop policy if exists "admins_update_applications" on public.applications;
create policy "admins_update_applications" on public.applications
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
