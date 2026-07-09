-- =====================================================
-- kbridge — Swipes (mobile Discover deck)
-- Run this in the Supabase SQL Editor AFTER 001–006.
--
-- A "swipe" is the mobile-first alternative to an
-- introduction request: like or pass on a member. When two
-- members like each other, a match (correspondence) opens
-- automatically — the same matches/messages tables the
-- introductions flow already uses.
-- =====================================================

create table if not exists public.swipes (
  id         uuid default gen_random_uuid() primary key,
  swiper_id  uuid references public.profiles(id) on delete cascade not null,
  swipee_id  uuid references public.profiles(id) on delete cascade not null,
  direction  text not null check (direction in ('like','pass')),
  match_id   uuid references public.matches(id) on delete set null,
  created_at timestamptz default now(),
  unique (swiper_id, swipee_id),
  check (swiper_id <> swipee_id)
);

create index if not exists swipes_swipee_likes
  on public.swipes (swipee_id, swiper_id)
  where direction = 'like';

alter table public.swipes enable row level security;

-- You may read only your own swipes. Who liked you stays
-- hidden until it becomes a match.
create policy "Users read own swipes"
  on public.swipes
  for select
  using (auth.uid() = swiper_id);

create policy "Users create own swipes"
  on public.swipes
  for insert
  with check (auth.uid() = swiper_id);

-- No update/delete policies: swipes are written once; only the
-- trigger below (SECURITY DEFINER) stamps match_id.

-- =====================================================
-- Trigger: a mutual like opens a match
-- =====================================================
create or replace function public.handle_swipe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reciprocal_id  uuid;
  existing_match uuid;
  new_match      uuid;
begin
  if new.direction <> 'like' then
    return new;
  end if;

  -- Serialize concurrent likes within a pair so two simultaneous
  -- swipes can't both miss the other's not-yet-committed row.
  perform pg_advisory_xact_lock(
    hashtextextended(
      least(new.swiper_id::text, new.swipee_id::text) || ':' ||
      greatest(new.swiper_id::text, new.swipee_id::text),
      0
    )
  );

  select id into reciprocal_id
  from public.swipes
  where swiper_id = new.swipee_id
    and swipee_id = new.swiper_id
    and direction = 'like'
  limit 1;

  if reciprocal_id is null then
    return new;
  end if;

  -- Mutual like: reuse an existing match (e.g. one opened earlier
  -- via an introduction) or create one.
  select id into existing_match
  from public.matches
  where (user_a = new.swiper_id and user_b = new.swipee_id)
     or (user_a = new.swipee_id and user_b = new.swiper_id)
  limit 1;

  if existing_match is null then
    insert into public.matches (user_a, user_b)
    values (new.swiper_id, new.swipee_id)
    returning id into new_match;
  else
    new_match := existing_match;
  end if;

  new.match_id := new_match;

  -- Stamp the earlier like too — the realtime UPDATE tells the
  -- first swiper about the match the moment it opens.
  update public.swipes set match_id = new_match where id = reciprocal_id;

  return new;
end;
$$;

drop trigger if exists swipe_created on public.swipes;
create trigger swipe_created
  before insert on public.swipes
  for each row execute procedure public.handle_swipe();

-- =====================================================
-- Deck candidates: completed profiles you haven't swiped on
-- and aren't already matched with. SECURITY INVOKER, so
-- profile visibility still goes through RLS.
-- =====================================================
create or replace function public.get_swipe_candidates(max_results integer default 20)
returns setof public.profiles
language sql
stable
security invoker
set search_path = public
as $$
  select p.*
  from public.profiles p
  where p.id <> auth.uid()
    and p.onboarding_complete = true
    and not exists (
      select 1 from public.swipes s
      where s.swiper_id = auth.uid()
        and s.swipee_id = p.id
    )
    and not exists (
      select 1 from public.matches m
      where (m.user_a = auth.uid() and m.user_b = p.id)
         or (m.user_b = auth.uid() and m.user_a = p.id)
    )
  order by p.created_at desc
  limit greatest(1, least(coalesce(max_results, 20), 50));
$$;

-- =====================================================
-- Realtime: clients subscribe to their own swipe rows so the
-- first swiper hears about a new match without polling.
-- =====================================================
do $$
begin
  alter publication supabase_realtime add table public.swipes;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
