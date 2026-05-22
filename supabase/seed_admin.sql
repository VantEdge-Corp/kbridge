-- =====================================================
-- Lineage — Admin Seed
-- Run this in the Supabase SQL Editor AFTER:
--   1. supabase/migrations/001_initial_schema.sql
--   2. supabase/migrations/002_applications_gate.sql
--   3. supabase/migrations/003_signup_flow.sql
--
-- Creates a bootstrap admin account you can log into with:
--   email:    admin@admin.local
--   password: admin
--
-- "admin" is shorter than Supabase's default 6-char password minimum.
-- We bypass that check by writing the bcrypt hash directly into
-- auth.users — the minimum is only enforced on the signup API, not on
-- raw SQL inserts or on the sign-in API.
--
-- Order matters: we insert an approved application FIRST, so when the
-- auth.users insert fires the handle_new_user trigger from migration
-- 002, the trigger finds the approved application and creates the
-- profile. We then promote that profile to is_admin = true.
-- =====================================================

-- ── 0. Heal the handle_new_user trigger ──────────────────
-- If your database has an older version of this function (from a
-- previous run of migration 002 that referenced profiles.application_status)
-- the auth.users insert below will fail with a "column does not exist"
-- error. Replacing the function here makes this seed idempotent.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.applications%rowtype;
begin
  select * into app
  from public.applications
  where lower(email) = lower(new.email)
    and status = 'approved'
  order by created_at desc
  limit 1;

  if app.id is null then
    raise exception 'No approved application for %', new.email
      using errcode = 'P0001';
  end if;

  insert into public.profiles (
    id, first_name, age, city, occupation, school, degree, bio,
    communities, onboarding_complete, member_number
  ) values (
    new.id, app.first_name, app.age, app.city, app.occupation,
    app.school, app.degree, app.bio,
    app.communities, true,
    '№ 0' || lpad(floor(random() * 9000 + 1000)::text, 4, '0')
  );

  update public.applications
     set status = 'claimed',
         claimed_by = new.id,
         updated_at = now()
   where id = app.id;

  return new;
end;
$$;

-- ── 1. Approved application for the admin email ──────────
insert into public.applications (
  email, status, first_name, decided_at, why
) values (
  'admin@admin.local',
  'approved',
  'Admin',
  now(),
  'Bootstrap admin account.'
)
on conflict do nothing;

-- ── 2. Auth user with bcrypt('admin') ────────────────────
-- pgcrypto is enabled by default on Supabase projects.
do $$
declare
  v_user_id uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = 'admin@admin.local') then
    raise notice 'auth.users row for admin@admin.local already exists; skipping insert.';
  else
    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated', 'authenticated',
      'admin@admin.local',
      crypt('admin', gen_salt('bf')),
      now(),
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false,
      '', '', '', ''
    );

    -- Newer Supabase Auth requires an identities row for password sign-in.
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub',           v_user_id::text,
        'email',         'admin@admin.local',
        'email_verified', true
      ),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  end if;
end $$;

-- ── 3. Promote to admin ──────────────────────────────────
-- handle_new_user already created the profile from the approved
-- application; we just flip the is_admin flag.
update public.profiles
   set is_admin = true
 where id = (select id from auth.users where email = 'admin@admin.local');

-- ── Verify ───────────────────────────────────────────────
-- These should each return one row.
select 'auth.users'   as source, id::text as id, email           as info from auth.users      where email = 'admin@admin.local'
union all
select 'profiles'     as source, id::text as id, coalesce(first_name, '—') as info from public.profiles
       where id = (select id from auth.users where email = 'admin@admin.local')
union all
select 'applications' as source, id::text as id, status          as info from public.applications
       where email = 'admin@admin.local';

-- =====================================================
-- If the auth.users insert above fails on your Supabase
-- version, the Dashboard alternative is:
--   Authentication → Users → Add user → admin@admin.local
--   with "Auto Confirm User" checked, password = adminadmin
--   (or any 6+ chars).
-- Then re-run sections 1 and 3 of this file.
-- =====================================================
