-- =====================================================
-- kbridge — Safety: blocks, reports, and account deletion
-- Run this in the Supabase SQL Editor AFTER 001–010.
--
-- These are App Store requirements for a user-generated-content / dating
-- app (Guideline 1.2): members can block and report each other, and can
-- delete their own account from within the app.
-- =====================================================

-- ── Blocks ────────────────────────────────────────────────
create table if not exists public.blocks (
  id         uuid default gen_random_uuid() primary key,
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "Read own blocks" on public.blocks;
create policy "Read own blocks" on public.blocks
  for select using (auth.uid() = blocker_id);

drop policy if exists "Create own blocks" on public.blocks;
create policy "Create own blocks" on public.blocks
  for insert with check (auth.uid() = blocker_id);

drop policy if exists "Delete own blocks" on public.blocks;
create policy "Delete own blocks" on public.blocks
  for delete using (auth.uid() = blocker_id);

-- ── Reports ───────────────────────────────────────────────
create table if not exists public.reports (
  id          uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  reported_id uuid references public.profiles(id) on delete cascade not null,
  reason      text not null,
  detail      text,
  match_id    uuid references public.matches(id) on delete set null,
  status      text not null default 'open'
                check (status in ('open','reviewed','actioned','dismissed')),
  created_at  timestamptz default now()
);

alter table public.reports enable row level security;

drop policy if exists "Reporter creates report" on public.reports;
create policy "Reporter creates report" on public.reports
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "Admins read reports" on public.reports;
create policy "Admins read reports" on public.reports
  for select using (public.is_admin());

drop policy if exists "Admins update reports" on public.reports;
create policy "Admins update reports" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

-- ── Account deletion ──────────────────────────────────────
-- Deleting the auth.users row cascades to profiles, and from there to
-- matches, messages, swipes, blocks, reports, etc. (all on delete cascade /
-- set null). SECURITY DEFINER so the function's owner (postgres) can delete
-- from the auth schema. If your project rejects the auth delete, the fallback
-- is an Edge Function using the service-role key.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- ── Deck excludes blocks (either direction) ───────────────
-- Redefine get_swipe_candidates (migration 010) so that anyone you blocked,
-- or who blocked you, never appears in your deck. Same signature + band.
create or replace function public.get_swipe_candidates(
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
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
  order by p.created_at desc
  limit greatest(1, least(coalesce(max_results, 20), 50));
$$;
