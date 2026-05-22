-- =====================================================
-- Lineage — Initial Schema
-- Run this in your Supabase SQL editor at:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =====================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id                      uuid references auth.users(id) on delete cascade primary key,
  first_name              text,
  age                     integer,
  city                    text,
  occupation              text,
  school                  text,
  degree                  text,
  bio                     text,
  communities             text[]  default '{}',
  tier                    text    not null default 'observer' check (tier in ('observer', 'member', 'founding')),
  invite_code_used        text,
  identity_verified       boolean default false,
  education_verified      boolean default false,
  photos_uploaded         integer default 0,
  pref_communities        text[]  default '{}',
  pref_age_min            integer default 24,
  pref_age_max            integer default 40,
  onboarding_complete     boolean default false,
  -- Tier usage counters
  intros_used_this_week   integer default 0,
  intros_week_reset_at    timestamptz default now(),
  invites_sent_this_month integer default 0,
  invites_month_reset_at  timestamptz default now(),
  -- Meta
  member_number           text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- Invitations (Founding members can generate these)
create table public.invitations (
  id           uuid default gen_random_uuid() primary key,
  code         text unique not null,
  created_by   uuid references public.profiles(id) on delete set null,
  used_by      uuid references public.profiles(id) on delete set null,
  used_at      timestamptz,
  expires_at   timestamptz default (now() + interval '30 days'),
  created_at   timestamptz default now()
);

-- Matches (mutual interest between two users)
create table public.matches (
  id         uuid default gen_random_uuid() primary key,
  user_a     uuid references public.profiles(id) on delete cascade not null,
  user_b     uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- (A,B) and (B,A) are the same pair. Postgres won't accept function
-- expressions inside an inline UNIQUE table constraint, so the
-- order-insensitive uniqueness is enforced with a separate
-- CREATE UNIQUE INDEX on least()/greatest().
create unique index if not exists matches_unique_pair
  on public.matches (
    least(user_a::text, user_b::text),
    greatest(user_a::text, user_b::text)
  );

-- Messages
create table public.messages (
  id         uuid default gen_random_uuid() primary key,
  match_id   uuid references public.matches(id) on delete cascade not null,
  sender_id  uuid references public.profiles(id) on delete cascade not null,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz default now()
);

-- Events (Founding tier access)
create table public.events (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  description text,
  city        text,
  event_date  timestamptz,
  tier_min    text not null default 'founding' check (tier_min in ('observer', 'member', 'founding')),
  capacity    integer,
  created_at  timestamptz default now()
);

-- Event RSVPs
create table public.event_rsvps (
  id         uuid default gen_random_uuid() primary key,
  event_id   uuid references public.events(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table public.profiles   enable row level security;
alter table public.invitations enable row level security;
alter table public.matches     enable row level security;
alter table public.messages    enable row level security;
alter table public.events      enable row level security;
alter table public.event_rsvps enable row level security;

-- Profiles
create policy "Own profile full access" on public.profiles
  for all using (auth.uid() = id);

create policy "Authenticated users can read completed profiles" on public.profiles
  for select using (
    auth.uid() is not null
    and onboarding_complete = true
    and id != auth.uid()
  );

-- Invitations
create policy "Founding members can create invites" on public.invitations
  for insert with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and tier = 'founding'
    )
  );

create policy "Anyone can read invite by code" on public.invitations
  for select using (true);

create policy "Redeemer can update invite" on public.invitations
  for update using (used_by = auth.uid() or used_by is null);

-- Matches
create policy "Users see own matches" on public.matches
  for select using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users create matches" on public.matches
  for insert with check (auth.uid() = user_a);

-- Messages
create policy "Users see messages in their matches" on public.messages
  for select using (
    exists (
      select 1 from public.matches
      where id = match_id
        and (user_a = auth.uid() or user_b = auth.uid())
    )
  );

create policy "Users send messages in their matches" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches
      where id = match_id
        and (user_a = auth.uid() or user_b = auth.uid())
    )
  );

-- Events
create policy "Founding members see events" on public.events
  for select using (
    auth.uid() is not null
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and tier in ('founding')
    )
  );

-- Event RSVPs
create policy "Users manage own RSVPs" on public.event_rsvps
  for all using (auth.uid() = user_id);

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, member_number)
  values (
    new.id,
    '№ 0' || lpad(floor(random() * 9000 + 1000)::text, 4, '0')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- RESET WEEKLY INTRO COUNTS (run via cron or pg_cron)
-- =====================================================
-- Optional: if you have pg_cron enabled:
-- select cron.schedule('reset-weekly-intros', '0 0 * * 1',
--   $$update public.profiles set intros_used_this_week = 0, intros_week_reset_at = now()$$
-- );

-- =====================================================
-- SEED SAMPLE EVENTS
-- =====================================================
insert into public.events (title, description, city, event_date, tier_min, capacity) values
  ('Founding Member Dinner — Spring', 'An intimate dinner for Founding members. Seven courses, four cities, one evening.', 'New York', now() + interval '14 days', 'founding', 24),
  ('Members'' Gallery Evening', 'Private after-hours access to a member-curated exhibition, followed by a reception.', 'Los Angeles', now() + interval '21 days', 'founding', 40),
  ('Conversation Series: Vol. III', 'An off-record conversation with three members on careers, ambition, and time.', 'San Francisco', now() + interval '28 days', 'founding', 32);
