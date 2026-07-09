-- =====================================================
-- kbridge — Member score (1–10) + match banding
-- Run this in the Supabase SQL Editor AFTER 001–009.
--
-- Admins assign each applicant a numeric score (a fixed +1-per-spec rubric,
-- e.g. degree, stable job) during review. The score is copied onto the member
-- profile at signup, and the swipe deck only shows people whose score is
-- within a band of yours (default ±2.5) so matches happen within tier.
--
-- The score is derived only from non-protected attributes (education,
-- employment). Keep it that way — it must never encode age, sex, appearance,
-- race, or national origin.
-- =====================================================

alter table public.applications
  add column if not exists score numeric(4,2) check (score >= 1 and score <= 10);

alter table public.profiles
  add column if not exists score numeric(4,2) check (score >= 1 and score <= 10);

-- ── Copy the score onto the profile at signup ─────────────
-- Redefine handle_new_user (from migration 002) to also carry the admin's
-- score from the approved application onto the new profile. Everything else
-- is unchanged: still gated on an approved application, still marks it claimed.
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
    communities, onboarding_complete, member_number, score
  ) values (
    new.id, app.first_name, app.age, app.city, app.occupation,
    app.school, app.degree, app.bio,
    app.communities, true,
    '№ 0' || lpad(floor(random() * 9000 + 1000)::text, 4, '0'),
    app.score
  );

  update public.applications
     set status = 'claimed',
         claimed_by = new.id,
         updated_at = now()
   where id = app.id;

  return new;
end;
$$;

-- ── Admin sets/updates a score ────────────────────────────
-- SECURITY DEFINER so an admin can also propagate a re-score onto an
-- already-active member's profile (profiles has no admin-UPDATE RLS policy).
create or replace function public.set_application_score(app_id uuid, new_score numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if new_score is not null and (new_score < 1 or new_score > 10) then
    raise exception 'Score must be between 1 and 10' using errcode = '22003';
  end if;

  update public.applications
     set score = new_score, updated_at = now()
   where id = app_id
   returning claimed_by into target;

  if target is not null then
    update public.profiles set score = new_score where id = target;
  end if;
end;
$$;

revoke all on function public.set_application_score(uuid, numeric) from public;
grant execute on function public.set_application_score(uuid, numeric) to authenticated;

-- ── Deck: only show people within the score band ──────────
-- Replaces get_swipe_candidates (migration 007) with a banded version. Both
-- the caller and the candidate must be scored, and their scores must be within
-- match_band of each other. |mine - theirs| <= band is symmetric, so if they
-- are in your band you are in theirs.
drop function if exists public.get_swipe_candidates(integer);

create function public.get_swipe_candidates(
  max_results integer default 20,
  match_band  numeric default 2.5
)
returns setof public.profiles
language sql
stable
security invoker
set search_path = public
as $$
  with me as (select score from public.profiles where id = auth.uid())
  select p.*
  from public.profiles p, me
  where p.id <> auth.uid()
    and p.onboarding_complete = true
    and me.score is not null
    and p.score is not null
    and abs(p.score - me.score) <= match_band
    and not exists (
      select 1 from public.swipes s
      where s.swiper_id = auth.uid() and s.swipee_id = p.id
    )
    and not exists (
      select 1 from public.matches m
      where (m.user_a = auth.uid() and m.user_b = p.id)
         or (m.user_b = auth.uid() and m.user_a = p.id)
    )
  order by p.created_at desc
  limit greatest(1, least(coalesce(max_results, 20), 50));
$$;

-- Note: a member with no score sees an empty deck (and is invisible to others)
-- until an admin scores them. Score applicants at admission so approved members
-- can match right away.
