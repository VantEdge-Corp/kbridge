-- =====================================================
-- Lineage — Introduction Requests
-- Run this in the Supabase SQL Editor AFTER 001–005.
--
-- An "introduction request" is the deliberate step that
-- precedes a match. The requester writes a short note,
-- the recipient reads it, and on accept a match (and
-- therefore a correspondence thread) is opened.
-- =====================================================

create table if not exists public.introduction_requests (
  id           uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  note         text not null check (char_length(note) between 20 and 500),
  status       text not null default 'pending'
                 check (status in ('pending','accepted','declined','withdrawn')),
  match_id     uuid references public.matches(id) on delete set null,
  created_at   timestamptz default now(),
  responded_at timestamptz,
  check (requester_id <> recipient_id)
);

-- Only one open or accepted request per ordered pair.
create unique index if not exists introduction_requests_active
  on public.introduction_requests (requester_id, recipient_id)
  where status in ('pending','accepted');

create index if not exists introduction_requests_recipient_pending
  on public.introduction_requests (recipient_id)
  where status = 'pending';

alter table public.introduction_requests enable row level security;

-- Participants can read.
create policy "Participants read intro requests"
  on public.introduction_requests
  for select
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Requester creates pending request.
create policy "Requester creates intro request"
  on public.introduction_requests
  for insert
  with check (
    auth.uid() = requester_id
    and status = 'pending'
  );

-- Recipient accepts/declines; requester may withdraw.
create policy "Update own intro request"
  on public.introduction_requests
  for update
  using (
    (auth.uid() = recipient_id and status = 'pending')
    or (auth.uid() = requester_id and status = 'pending')
  );

-- =====================================================
-- Trigger: on accept, open a match (correspondence)
-- =====================================================
create or replace function public.handle_introduction_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_match uuid;
  new_match      uuid;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'accepted' and old.status = 'pending' then
    select id into existing_match
    from public.matches
    where (user_a = new.requester_id and user_b = new.recipient_id)
       or (user_a = new.recipient_id and user_b = new.requester_id)
    limit 1;

    if existing_match is null then
      insert into public.matches (user_a, user_b)
      values (new.requester_id, new.recipient_id)
      returning id into new_match;
      new.match_id := new_match;
    else
      new.match_id := existing_match;
    end if;

    new.responded_at := now();
  elsif new.status in ('declined','withdrawn') and old.status = 'pending' then
    new.responded_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists introduction_status_change on public.introduction_requests;
create trigger introduction_status_change
  before update on public.introduction_requests
  for each row execute procedure public.handle_introduction_response();

-- =====================================================
-- Loosen matches insert policy so the trigger (running
-- as a SECURITY DEFINER function) can persist either
-- ordering of (user_a, user_b).
-- =====================================================
drop policy if exists "Users create matches" on public.matches;
create policy "Users create own-side matches"
  on public.matches
  for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- =====================================================
-- Mark messages as read
-- =====================================================
create policy "Recipients mark messages read"
  on public.messages
  for update
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.matches
      where id = match_id
        and (user_a = auth.uid() or user_b = auth.uid())
    )
  )
  with check (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.matches
      where id = match_id
        and (user_a = auth.uid() or user_b = auth.uid())
    )
  );
