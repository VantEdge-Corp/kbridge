-- =====================================================
-- Lineage — Applications Gate
-- Run this AFTER 001_initial_schema.sql in the Supabase SQL editor.
--
-- This migration moves the application out of the profiles
-- table so that no auth.users row is ever created until the
-- membership committee approves the applicant. Anyone can
-- submit an application without an account; only approved
-- applicants can claim credentials via magic-link login.
-- =====================================================

-- ── Multi-admin flag on profiles ──────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ── Applications (decoupled from auth.users) ──────────────
create table if not exists public.applications (
  id              uuid default gen_random_uuid() primary key,
  email           text not null,
  status          text not null default 'pending'
                    check (status in ('pending','approved','rejected','waitlisted','claimed')),

  -- application body (mirror of the onboarding fields)
  first_name      text not null,
  age             integer,
  city            text,
  occupation      text,
  school          text,
  degree          text,
  bio             text,
  link            text,        -- portfolio / website / LinkedIn
  why             text,        -- "why do you want to join"
  communities     text[]       default '{}',

  -- catch-all for additional payload fields without schema churn
  payload         jsonb        default '{}'::jsonb,

  -- public lookup token (used on the status page)
  status_token    text         not null unique default encode(gen_random_bytes(24), 'hex'),

  -- committee decision
  internal_note   text,
  decided_at      timestamptz,
  decided_by      uuid         references auth.users(id) on delete set null,

  -- once the applicant claims credentials, this points at the auth user
  claimed_by      uuid         references auth.users(id) on delete set null,

  created_at      timestamptz  default now(),
  updated_at      timestamptz  default now()
);

-- One open application per email (pending or approved-but-unclaimed).
-- Lets the same email re-apply after a 'rejected' or 'claimed' status.
create unique index if not exists applications_email_open_unique
  on public.applications (lower(email))
  where status in ('pending','approved','waitlisted');

create index if not exists idx_applications_status_created
  on public.applications (status, created_at desc);

-- ── Row Level Security ────────────────────────────────────
alter table public.applications enable row level security;

-- Anonymous and authenticated users can submit applications.
drop policy if exists "anyone_can_apply" on public.applications;
create policy "anyone_can_apply" on public.applications
  for insert
  to anon, authenticated
  with check (true);

-- Admins (is_admin flag on their profile) can read all applications.
drop policy if exists "admins_read_applications" on public.applications;
create policy "admins_read_applications" on public.applications
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Admins can update applications (decisions, internal notes).
drop policy if exists "admins_update_applications" on public.applications;
create policy "admins_update_applications" on public.applications
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- A signed-in user can read the application that matches their email.
-- (Useful after first login; the public status page goes through an
-- RPC so it does not need this policy.)
drop policy if exists "applicant_reads_own_application" on public.applications;
create policy "applicant_reads_own_application" on public.applications
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email','')));

-- Admins also need to be able to read all profiles in the committee panel.
drop policy if exists "admins_read_all_profiles" on public.profiles;
create policy "admins_read_all_profiles" on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ── Public status lookup (silent-decline aware) ───────────
-- Anyone (anon or authenticated) can look up an application by its
-- status_token. We deliberately collapse 'rejected' to 'pending' so
-- declined applicants do not learn they were declined — this is the
-- "silent decline" policy.
create or replace function public.get_application_status(p_token text)
returns table (status text, first_name text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select
    case when status = 'rejected' then 'pending' else status end as status,
    first_name,
    created_at
  from public.applications
  where status_token = p_token
  limit 1;
$$;

revoke all on function public.get_application_status(text) from public;
grant execute on function public.get_application_status(text) to anon, authenticated;

-- ── Email-based pre-check for the login page ──────────────
-- Returns the public-facing status for an email so the login form
-- can refuse to send a magic link unless the application is approved.
-- Silent-decline applies here too.
create or replace function public.get_application_email_status(p_email text)
returns text
language sql
security definer
set search_path = public
as $$
  select
    case
      when status = 'rejected' then 'pending'
      else status
    end
  from public.applications
  where lower(email) = lower(p_email)
  order by created_at desc
  limit 1;
$$;

revoke all on function public.get_application_email_status(text) from public;
grant execute on function public.get_application_email_status(text) to anon, authenticated;

-- ── handle_new_user: gate signups behind an approved application ──
-- Replaces the trigger from 001. If a magic-link login attempts to
-- create an auth.users row for an email with no approved application,
-- we raise — Supabase rolls back the signup and the user cannot log in.
-- When an approved application exists we hydrate the profile from it
-- and mark the application as 'claimed'.
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

  -- Note: profiles.application_status from the legacy migration_ai_scoring.sql
  -- is intentionally NOT referenced here. The applications table is the
  -- single source of truth for application status now.
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

-- Trigger already exists from 001 (on_auth_user_created). Recreating
-- the function above is enough; no need to re-create the trigger.

-- ── Keep updated_at fresh on applications ─────────────────
create or replace function public.touch_applications_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_applications_updated_at on public.applications;
create trigger trg_applications_updated_at
  before update on public.applications
  for each row execute procedure public.touch_applications_updated_at();
