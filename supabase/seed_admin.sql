-- ============================================================================
-- seed_admin.sql: bootstrap the first committee admin.
-- Run in the Supabase SQL Editor AFTER migrations 001-013.
--
--   email:    admin@admin.local
--   password: admin
--
-- "admin" is shorter than the 6-character minimum the signup API enforces; the
-- hash is written directly so the minimum does not apply. Change the password
-- from Settings > Account after the first sign-in.
--
-- Idempotent: safe to re-run. This file deliberately does NOT redefine any
-- function; handle_new_user comes from migration 013.
-- ============================================================================

-- 1. An approved application so the signup trigger can hydrate the profile.
insert into public.applications (email, status, first_name, bio, why, decided_at, age_confirmed, consented_at)
select 'admin@admin.local', 'approved', 'Admin', 'Committee account.', 'Bootstrap admin account.', now(), true, now()
where not exists (
  select 1 from public.applications
  where lower(email) = 'admin@admin.local' and status in ('approved', 'claimed')
);

-- 2. The auth user (fires on_auth_user_created -> handle_new_user).
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'admin@admin.local';
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'admin@admin.local', crypt('admin', gen_salt('bf')), now(),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
      '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@admin.local', 'email_verified', true),
      'email', v_user_id::text, now(), now(), now()
    );
  end if;

  -- 3. Committee flag. The admin is not a discoverable member.
  update public.profiles
     set is_admin = true,
         onboarding_complete = false
   where id = v_user_id;
end $$;

-- Verify
select u.email, p.is_admin, p.onboarding_complete
  from auth.users u
  join public.profiles p on p.id = u.id
 where u.email = 'admin@admin.local';

-- ----------------------------------------------------------------------------
-- If the auth.users insert is rejected on your Supabase version, create the
-- user from the Dashboard instead: Authentication > Users > Add user >
-- admin@admin.local, "Auto Confirm User" checked, any 6+ character password.
-- Then re-run this file so steps 1 and 3 apply.
-- ----------------------------------------------------------------------------
