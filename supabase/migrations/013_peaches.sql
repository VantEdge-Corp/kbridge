-- ============================================================================
-- 013_peaches.sql
--
-- Peaches: the structured member model on top of the existing admission gate.
--
--   * areas                 Metro Atlanta areas with centroids. Members pick one
--                           as their PRIVATE location; other members only ever
--                           see the coarse public label.
--   * profiles              Public, structured fields (height, nationalities,
--                           race/ethnicity + disclosure, languages, intent,
--                           lifestyle, interests, industry, student status),
--                           four independent verification states, activity,
--                           suspension.
--   * member_private        Owner-only: private area, search radius, structured
--                           education and employment with display toggles. A
--                           trigger derives the public display strings.
--   * member_preferences    Owner-only JSON preferences, one strength per
--                           dimension: required / preferred / any.
--   * recommendation_signals  Server-only exposure counters. No client policy.
--   * public_profiles       The ONLY way one member reads another member's
--                           profile. It projects public columns and the list
--                           of verified badges; pending/rejected states, the
--                           admin score, consent versions and is_admin never
--                           leave the table.
--   * posts / post_saves / post_comments   Feed.
--   * get_discovery_candidates()   Candidate ids + coarse signals (whole miles,
--                           bucketed counters, day-truncated timestamps, and a
--                           reverse-compatibility number computed here from the
--                           candidate's private preferences so those never
--                           reach another device).
--   * Realtime publication for messages, introduction_requests and posts.
--
-- Requires 001-012. Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Table privileges
--
-- Hosted Supabase projects created before 2025 granted these to the API roles
-- by default; newer Postgres images do not. Migrations 001-012 rely on the old
-- default, so state the grants explicitly. Row-level security still decides
-- which rows each role may touch; a grant with no matching policy yields nothing.
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
-- anon gets only what the public admission flow needs; everything else is a
-- security-definer function.
grant insert on public.applications to anon;

-- ----------------------------------------------------------------------------
-- 1. Areas
-- ----------------------------------------------------------------------------
create table if not exists public.areas (
  id text primary key,
  name text not null,
  public_label text not null,
  lat double precision not null,
  lng double precision not null
);

alter table public.areas enable row level security;

grant select on public.areas to anon, authenticated;

drop policy if exists "Anyone can read areas" on public.areas;
create policy "Anyone can read areas"
  on public.areas for select
  to anon, authenticated
  using (true);

insert into public.areas (id, name, public_label, lat, lng) values
  ('downtown-atlanta', 'Downtown Atlanta', 'Atlanta', 33.749, -84.388),
  ('midtown-atlanta', 'Midtown Atlanta', 'Midtown Atlanta', 33.7838, -84.383),
  ('buckhead', 'Buckhead', 'Buckhead', 33.8384, -84.3795),
  ('west-midtown', 'West Midtown', 'West Midtown', 33.783, -84.411),
  ('old-fourth-ward', 'Old Fourth Ward', 'Old Fourth Ward', 33.764, -84.369),
  ('inman-park', 'Inman Park', 'Inman Park', 33.759, -84.352),
  ('virginia-highland', 'Virginia-Highland', 'Virginia-Highland', 33.781, -84.354),
  ('east-atlanta', 'East Atlanta', 'East Atlanta', 33.74, -84.34),
  ('west-end', 'West End', 'West End', 33.736, -84.415),
  ('decatur', 'Decatur', 'Decatur', 33.7748, -84.2963),
  ('brookhaven', 'Brookhaven', 'Brookhaven', 33.8651, -84.3366),
  ('chamblee', 'Chamblee', 'Chamblee area', 33.8921, -84.2988),
  ('sandy-springs', 'Sandy Springs', 'Sandy Springs', 33.9304, -84.3733),
  ('dunwoody', 'Dunwoody', 'Dunwoody', 33.9462, -84.3346),
  ('smyrna', 'Smyrna', 'Smyrna area', 33.884, -84.5144),
  ('vinings', 'Vinings', 'Vinings', 33.865, -84.465),
  ('marietta', 'Marietta', 'Marietta area', 33.9526, -84.5499),
  ('kennesaw', 'Kennesaw', 'Kennesaw area', 34.0234, -84.6155),
  ('roswell', 'Roswell', 'Roswell area', 34.0232, -84.3616),
  ('alpharetta', 'Alpharetta', 'Alpharetta area', 34.0754, -84.2941),
  ('johns-creek', 'Johns Creek', 'Johns Creek area', 34.0289, -84.1986),
  ('duluth', 'Duluth', 'Duluth area', 34.0029, -84.1446),
  ('suwanee', 'Suwanee', 'Suwanee area', 34.0515, -84.0713),
  ('norcross', 'Norcross', 'Norcross area', 33.9412, -84.2135),
  ('lawrenceville', 'Lawrenceville', 'Lawrenceville area', 33.9562, -83.988),
  ('cumming', 'Cumming', 'Cumming area', 34.2073, -84.1402),
  ('woodstock', 'Woodstock', 'Woodstock area', 34.1015, -84.5194),
  ('stone-mountain', 'Stone Mountain', 'Stone Mountain area', 33.8081, -84.1702),
  ('college-park', 'College Park', 'College Park area', 33.6534, -84.4494),
  ('peachtree-city', 'Peachtree City', 'Peachtree City area', 33.3968, -84.5957),
  ('athens', 'Athens', 'Athens area', 33.951, -83.3576)
on conflict (id) do update
  set name = excluded.name,
      public_label = excluded.public_label,
      lat = excluded.lat,
      lng = excluded.lng;

create or replace function public.miles_between(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable
as $$
  select 2 * 3958.8 * asin(least(1::double precision, sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  )));
$$;

-- ----------------------------------------------------------------------------
-- 2. Public structured columns on profiles
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists height_cm integer
    check (height_cm is null or (height_cm between 100 and 250)),
  add column if not exists industry text,
  add column if not exists student_status text
    check (student_status is null or student_status in ('undergraduate', 'graduate', 'professional')),
  add column if not exists nationalities text[] not null default '{}',
  add column if not exists race_ethnicities text[] not null default '{}',
  add column if not exists race_ethnicity_disclosure text not null default 'not_provided'
    check (race_ethnicity_disclosure in ('disclosed', 'prefer_not_to_say', 'not_provided')),
  add column if not exists languages text[] not null default '{}',
  add column if not exists display_area text,
  add column if not exists relationship_intent text
    check (relationship_intent is null or relationship_intent in
      ('long_term', 'marriage_minded', 'intentional_dating', 'open_to_possibilities')),
  add column if not exists lifestyle jsonb not null default '{}'::jsonb,
  add column if not exists interests text[] not null default '{}',
  add column if not exists employment_display text,
  add column if not exists education_display text,
  add column if not exists education_degree_level text,
  add column if not exists last_active_at timestamptz not null default now(),
  add column if not exists verification_identity text not null default 'unverified'
    check (verification_identity in ('unverified', 'pending', 'verified', 'rejected')),
  add column if not exists verification_education text not null default 'unverified'
    check (verification_education in ('unverified', 'pending', 'verified', 'rejected')),
  add column if not exists verification_student text not null default 'unverified'
    check (verification_student in ('unverified', 'pending', 'verified', 'rejected')),
  add column if not exists verification_employment text not null default 'unverified'
    check (verification_employment in ('unverified', 'pending', 'verified', 'rejected')),
  add column if not exists suspended_at timestamptz;

alter table public.profiles drop constraint if exists profiles_photo_paths_limit;
alter table public.profiles add constraint profiles_photo_paths_limit
  check (coalesce(array_length(photo_paths, 1), 0) <= 6);

create index if not exists profiles_last_active_idx on public.profiles (last_active_at desc);

-- Applicants choose an area on the form; the committee still sees a city name.
alter table public.applications
  add column if not exists area_id text references public.areas(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 3. Private member data (owner only) and the derived public display strings
-- ----------------------------------------------------------------------------
create table if not exists public.member_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  area_id text references public.areas(id) on delete set null,
  max_distance_miles integer not null default 25
    check (max_distance_miles between 1 and 500),
  school text not null default '',
  degree_level text
    check (degree_level is null or degree_level in
      ('high_school', 'associate', 'bachelor', 'master', 'doctorate', 'professional', 'other')),
  field_of_study text not null default '',
  graduation_year integer
    check (graduation_year is null or (graduation_year between 1950 and 2100)),
  currently_enrolled boolean not null default false,
  education_display_enabled boolean not null default true,
  occupation text not null default '',
  employer text not null default '',
  employment_status text
    check (employment_status is null or employment_status in
      ('student', 'employed', 'self_employed', 'between_roles', 'other')),
  employer_display_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_private enable row level security;

drop policy if exists "Owner manages private data" on public.member_private;
create policy "Owner manages private data"
  on public.member_private for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read private data" on public.member_private;
create policy "Admins read private data"
  on public.member_private for select
  to authenticated
  using (public.is_admin());

-- Mirrors educationDisplay() / employmentDisplay() in @peaches/core.
create or replace function public.sync_public_profile_from_private()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  degree_abbr text;
  edu text;
  emp text;
  area_label text;
begin
  degree_abbr := case new.degree_level
    when 'high_school' then 'High school'
    when 'associate' then 'Associate''s'
    when 'bachelor' then 'Bachelor''s'
    when 'master' then 'Master''s'
    when 'doctorate' then 'Doctorate'
    when 'professional' then 'Professional degree'
    else '' end;

  if new.education_display_enabled and (new.school <> '' or new.degree_level is not null) then
    edu := concat_ws(' · ',
      nullif(new.school, ''),
      nullif(concat_ws(', ', nullif(degree_abbr, ''), nullif(new.field_of_study, '')), ''));
  else
    edu := null;
  end if;

  emp := concat_ws(' · ',
    nullif(new.occupation, ''),
    case when new.employer_display_enabled then nullif(new.employer, '') end);

  select a.public_label into area_label from public.areas a where a.id = new.area_id;

  update public.profiles
     set occupation = new.occupation,
         employment_display = nullif(emp, ''),
         education_display = nullif(edu, ''),
         education_degree_level = case when new.education_display_enabled then new.degree_level end,
         display_area = coalesce(area_label, 'Metro Atlanta'),
         updated_at = now()
   where id = new.user_id;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists member_private_sync on public.member_private;
create trigger member_private_sync
  before insert or update on public.member_private
  for each row execute function public.sync_public_profile_from_private();

-- ----------------------------------------------------------------------------
-- 4. Preferences (owner only). Shape: the Preferences type in @peaches/core.
-- ----------------------------------------------------------------------------
create table if not exists public.member_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.member_preferences enable row level security;

drop policy if exists "Owner manages preferences" on public.member_preferences;
create policy "Owner manages preferences"
  on public.member_preferences for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists member_preferences_touch on public.member_preferences;
create trigger member_preferences_touch
  before update on public.member_preferences
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Server-only signals
-- ----------------------------------------------------------------------------
create table if not exists public.recommendation_signals (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  exposure_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.recommendation_signals enable row level security;
revoke all on public.recommendation_signals from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. Feed
-- ----------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 600),
  photo_path text,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);

create table if not exists public.post_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

create or replace function public.blocked_between(a uuid, b uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;
revoke all on function public.blocked_between(uuid, uuid) from public;
grant execute on function public.blocked_between(uuid, uuid) to authenticated;

create or replace function public.member_visible(p uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p and onboarding_complete and suspended_at is null
  );
$$;
revoke all on function public.member_visible(uuid) from public;
grant execute on function public.member_visible(uuid) to authenticated;

alter table public.posts enable row level security;
alter table public.post_saves enable row level security;
alter table public.post_comments enable row level security;

drop policy if exists "Members read visible posts" on public.posts;
create policy "Members read visible posts"
  on public.posts for select to authenticated
  using (
    author_id = auth.uid()
    or (not public.blocked_between(auth.uid(), author_id) and public.member_visible(author_id))
  );

drop policy if exists "Members write own posts" on public.posts;
create policy "Members write own posts"
  on public.posts for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists "Members delete own posts" on public.posts;
create policy "Members delete own posts"
  on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists "Owner manages saves" on public.post_saves;
create policy "Owner manages saves"
  on public.post_saves for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members read comments on visible posts" on public.post_comments;
create policy "Members read comments on visible posts"
  on public.post_comments for select to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_id)
    and not public.blocked_between(auth.uid(), author_id)
  );

drop policy if exists "Members comment on visible posts" on public.post_comments;
create policy "Members comment on visible posts"
  on public.post_comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_id)
  );

drop policy if exists "Members delete own comments" on public.post_comments;
create policy "Members delete own comments"
  on public.post_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', true)
on conflict (id) do nothing;

drop policy if exists "own_post_photos_insert" on storage.objects;
create policy "own_post_photos_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "own_post_photos_delete" on storage.objects;
create policy "own_post_photos_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.reports
  add column if not exists post_id uuid references public.posts(id) on delete set null;

alter table public.introduction_requests
  add column if not exists post_id uuid references public.posts(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 7. Conversation request guard: blocks, availability, daily limit
-- ----------------------------------------------------------------------------
create or replace function public.guard_introduction_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sent_today integer;
begin
  if public.blocked_between(new.requester_id, new.recipient_id) then
    raise exception 'You can''t send a request to this member.' using errcode = 'P0001';
  end if;
  if not public.member_visible(new.recipient_id) then
    raise exception 'This member isn''t available right now.' using errcode = 'P0001';
  end if;
  select count(*) into sent_today
    from public.introduction_requests
   where requester_id = new.requester_id
     and created_at > now() - interval '24 hours';
  if sent_today >= 8 then
    raise exception 'You''ve reached today''s request limit. Try again tomorrow.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists introduction_request_guard on public.introduction_requests;
create trigger introduction_request_guard
  before insert on public.introduction_requests
  for each row execute function public.guard_introduction_request();

-- ----------------------------------------------------------------------------
-- 8. Activity, verification, suspension
-- ----------------------------------------------------------------------------
create or replace function public.touch_last_active()
returns void
language sql security definer
set search_path = public
as $$
  update public.profiles
     set last_active_at = now()
   where id = auth.uid()
     and last_active_at < now() - interval '15 minutes';
$$;
revoke all on function public.touch_last_active() from public;
grant execute on function public.touch_last_active() to authenticated;

create or replace function public.request_verification(p_dimension text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_dimension not in ('identity', 'education', 'student', 'employment') then
    raise exception 'Unknown verification dimension' using errcode = '22023';
  end if;
  execute format(
    'update public.profiles set verification_%I = ''pending'', updated_at = now()
      where id = $1 and verification_%I in (''unverified'', ''rejected'')',
    p_dimension, p_dimension)
  using auth.uid();
end;
$$;
revoke all on function public.request_verification(text) from public;
grant execute on function public.request_verification(text) to authenticated;

create or replace function public.set_verification(p_profile uuid, p_dimension text, p_state text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_dimension not in ('identity', 'education', 'student', 'employment') then
    raise exception 'Unknown verification dimension' using errcode = '22023';
  end if;
  if p_state not in ('unverified', 'pending', 'verified', 'rejected') then
    raise exception 'Unknown verification state' using errcode = '22023';
  end if;
  execute format(
    'update public.profiles set verification_%I = $2, updated_at = now() where id = $1',
    p_dimension)
  using p_profile, p_state;
end;
$$;
revoke all on function public.set_verification(uuid, text, text) from public;
grant execute on function public.set_verification(uuid, text, text) to authenticated;

create or replace function public.set_member_suspended(p_profile uuid, p_suspended boolean)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.profiles
     set suspended_at = case when p_suspended then coalesce(suspended_at, now()) end,
         updated_at = now()
   where id = p_profile;
end;
$$;
revoke all on function public.set_member_suspended(uuid, boolean) from public;
grant execute on function public.set_member_suspended(uuid, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- 9. public_profiles: the only cross-member read path
-- ----------------------------------------------------------------------------
drop policy if exists "Authenticated users can read completed profiles" on public.profiles;

drop view if exists public.public_profiles;
-- Intentionally a definer view (owner: postgres). It projects public columns
-- only and filters to visible members, so the underlying table can keep
-- owner-only row security.
create view public.public_profiles as
  select
    p.id,
    p.first_name,
    p.age,
    p.height_cm,
    p.photo_paths,
    p.occupation,
    p.employment_display,
    p.education_display,
    p.education_degree_level,
    p.industry,
    p.student_status,
    p.nationalities,
    p.race_ethnicities,
    p.race_ethnicity_disclosure,
    p.languages,
    -- Derived live from the private area so it can never drift from it.
    coalesce(a.public_label, 'Metro Atlanta') as display_area,
    p.relationship_intent,
    p.lifestyle,
    p.interests,
    p.bio,
    array_remove(array[
      case when p.verification_identity = 'verified' then 'identity' end,
      case when p.verification_education = 'verified' then 'education' end,
      case when p.verification_student = 'verified' then 'student' end,
      case when p.verification_employment = 'verified' then 'employment' end
    ], null)::text[] as verified_badges
  from public.profiles p
  left join public.member_private mp on mp.user_id = p.id
  left join public.areas a on a.id = mp.area_id
  where p.onboarding_complete and p.suspended_at is null;

revoke all on public.public_profiles from anon, public;
grant select on public.public_profiles to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 10. Preference evaluation (mirrors matching/compatibility.ts in @peaches/core)
-- ----------------------------------------------------------------------------
create or replace function public.pref_strength(prefs jsonb, key text)
returns text language sql immutable as $$
  select case
    when prefs -> key is null then 'any'
    when (prefs -> key ? 'values')
         and jsonb_array_length(coalesce(prefs -> key -> 'values', '[]'::jsonb)) = 0 then 'any'
    else coalesce(prefs -> key ->> 'strength', 'any')
  end;
$$;

create or replace function public.pref_multi_match(prefs jsonb, key text, vals text[])
returns boolean language sql immutable as $$
  select vals is not null and exists (
    select 1 from jsonb_array_elements_text(coalesce(prefs -> key -> 'values', '[]'::jsonb)) e
    where e = any (vals)
  );
$$;

create or replace function public.pref_range_match(prefs jsonb, key text, val numeric, tolerance numeric)
returns numeric language sql immutable as $$
  select case
    when val is null then 0
    when val >= (prefs -> key ->> 'min')::numeric and val <= (prefs -> key ->> 'max')::numeric then 1
    when (case when val < (prefs -> key ->> 'min')::numeric
               then (prefs -> key ->> 'min')::numeric - val
               else val - (prefs -> key ->> 'max')::numeric end) <= tolerance then 0.5
    else 0
  end;
$$;

create or replace function public.pref_candidate_values(cand public.profiles, key text)
returns text[] language plpgsql immutable as $$
declare
  v text[];
  s text;
begin
  case key
    when 'nationalities' then v := cand.nationalities;
    when 'raceEthnicities' then
      if cand.race_ethnicity_disclosure <> 'disclosed' then return null; end if;
      v := cand.race_ethnicities;
    when 'languages' then v := cand.languages;
    when 'education' then
      if cand.education_degree_level is null then return null; end if;
      v := array[cand.education_degree_level];
    when 'occupation' then
      if cand.industry is null then return null; end if;
      v := array[cand.industry];
    when 'studentStatus' then
      if cand.student_status is null then return null; end if;
      v := array[cand.student_status];
    when 'relationshipIntent' then
      if cand.relationship_intent is null then return null; end if;
      v := array[cand.relationship_intent];
    when 'drinking' then
      s := cand.lifestyle ->> 'drinking';
      if s is null or s = 'prefer_not_to_say' then return null; end if;
      v := array[s];
    when 'smoking' then
      s := cand.lifestyle ->> 'smoking';
      if s is null or s = 'prefer_not_to_say' then return null; end if;
      v := array[s];
    when 'children' then
      s := cand.lifestyle ->> 'children';
      if s is null or s = 'prefer_not_to_say' then return null; end if;
      v := array[s];
    when 'interests' then v := cand.interests;
    else return null;
  end case;
  if v is null or coalesce(array_length(v, 1), 0) = 0 then return null; end if;
  return v;
end;
$$;

create or replace function public.pref_eligible(prefs jsonb, cand public.profiles)
returns boolean language plpgsql stable as $$
declare
  k text;
begin
  if public.pref_strength(prefs, 'ageRange') = 'required'
     and public.pref_range_match(prefs, 'ageRange', cand.age, 0) < 1 then
    return false;
  end if;
  if public.pref_strength(prefs, 'height') = 'required'
     and public.pref_range_match(prefs, 'height', cand.height_cm, 0) < 1 then
    return false;
  end if;
  foreach k in array array['nationalities','raceEthnicities','languages','education','occupation',
                           'studentStatus','relationshipIntent','drinking','smoking','children','interests'] loop
    if public.pref_strength(prefs, k) = 'required'
       and not public.pref_multi_match(prefs, k, public.pref_candidate_values(cand, k)) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.pref_compatibility(prefs jsonb, cand public.profiles)
returns numeric language plpgsql stable as $$
declare
  k text;
  w numeric := 0;
  m numeric := 0;
  vals text[];
begin
  if public.pref_strength(prefs, 'ageRange') = 'preferred' and cand.age is not null then
    w := w + 1; m := m + public.pref_range_match(prefs, 'ageRange', cand.age, 3);
  end if;
  if public.pref_strength(prefs, 'height') = 'preferred' and cand.height_cm is not null then
    w := w + 1; m := m + public.pref_range_match(prefs, 'height', cand.height_cm, 5);
  end if;
  foreach k in array array['nationalities','raceEthnicities','languages','education','occupation',
                           'studentStatus','relationshipIntent','drinking','smoking','children','interests'] loop
    if public.pref_strength(prefs, k) = 'preferred' then
      vals := public.pref_candidate_values(cand, k);
      if vals is not null then
        w := w + 1;
        if public.pref_multi_match(prefs, k, vals) then m := m + 1; end if;
      end if;
    end if;
  end loop;
  if w = 0 then return 0.5; end if;
  return round(m / w, 2);
end;
$$;

-- ----------------------------------------------------------------------------
-- 11. Coarse signals and the discovery RPC
-- ----------------------------------------------------------------------------
create or replace function public.signal_demand_bucket(p uuid)
returns integer language sql stable security definer
set search_path = public
as $$
  select case
    when c = 0 then 0 when c <= 1 then 1 when c <= 2 then 2 when c <= 3 then 3
    when c <= 5 then 5 when c <= 8 then 8 when c <= 13 then 13 else 21 end
  from (
    select count(*) as c from public.introduction_requests
    where recipient_id = p and created_at > now() - interval '30 days'
  ) t;
$$;

create or replace function public.signal_exposure_bucket(p uuid)
returns integer language sql stable security definer
set search_path = public
as $$
  select case
    when c = 0 then 0 when c <= 1 then 1 when c <= 2 then 2 when c <= 4 then 4
    when c <= 8 then 8 when c <= 16 then 16 when c <= 32 then 32 else 64 end
  from (
    select coalesce((select exposure_count from public.recommendation_signals where profile_id = p), 0) as c
  ) t;
$$;

revoke all on function public.signal_demand_bucket(uuid) from public;
revoke all on function public.signal_exposure_bucket(uuid) from public;

create or replace function public.get_discovery_candidates(p_limit integer default 200)
returns table (
  profile_id uuid,
  distance_miles integer,
  demand_bucket integer,
  exposure_bucket integer,
  last_active_day timestamptz,
  created_day timestamptz,
  reverse_compatibility numeric,
  reverse_eligible boolean
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  me_profile public.profiles%rowtype;
  me_lat double precision;
  me_lng double precision;
  me_max integer := 25;
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into me_profile from public.profiles where id = me;

  select a.lat, a.lng, mp.max_distance_miles
    into me_lat, me_lng, me_max
    from public.member_private mp
    left join public.areas a on a.id = mp.area_id
   where mp.user_id = me;
  me_max := coalesce(me_max, 25);

  return query
  with pool as (
    select p.*,
           a.lat as cand_lat,
           a.lng as cand_lng,
           pr.prefs as cand_prefs,
           mp.max_distance_miles as cand_max
      from public.profiles p
      left join public.member_private mp on mp.user_id = p.id
      left join public.areas a on a.id = mp.area_id
      left join public.member_preferences pr on pr.user_id = p.id
     where p.id <> me
       and p.onboarding_complete
       and p.suspended_at is null
       and not exists (
         select 1 from public.blocks b
          where (b.blocker_id = me and b.blocked_id = p.id) or (b.blocker_id = p.id and b.blocked_id = me))
       and not exists (
         select 1 from public.matches m
          where (m.user_a = me and m.user_b = p.id) or (m.user_a = p.id and m.user_b = me))
       and not exists (
         select 1 from public.introduction_requests ir
          where ir.status in ('pending', 'accepted')
            and ((ir.requester_id = me and ir.recipient_id = p.id) or (ir.requester_id = p.id and ir.recipient_id = me)))
  ), scored as (
    select pool.*,
           case when me_lat is not null and pool.cand_lat is not null
                then round(public.miles_between(me_lat, me_lng, pool.cand_lat, pool.cand_lng))::integer
                else 0 end as dist
      from pool
  )
  select s.id,
         s.dist,
         public.signal_demand_bucket(s.id),
         public.signal_exposure_bucket(s.id),
         date_trunc('day', s.last_active_at),
         date_trunc('day', s.created_at),
         public.pref_compatibility(coalesce(s.cand_prefs, '{}'::jsonb), me_profile),
         (public.pref_eligible(coalesce(s.cand_prefs, '{}'::jsonb), me_profile)
           and s.dist <= coalesce(s.cand_max, 25))
    from scored s
   where s.dist <= me_max
   order by s.last_active_at desc
   limit greatest(1, least(coalesce(p_limit, 200), 500));
end;
$$;
revoke all on function public.get_discovery_candidates(integer) from public;
grant execute on function public.get_discovery_candidates(integer) to authenticated;

create or replace function public.record_impressions(p_ids uuid[])
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if coalesce(array_length(p_ids, 1), 0) > 100 then
    raise exception 'Too many impressions in one call' using errcode = '22023';
  end if;
  insert into public.recommendation_signals (profile_id, exposure_count, updated_at)
  select distinct unnest(p_ids), 1, now()
  on conflict (profile_id) do update
    set exposure_count = public.recommendation_signals.exposure_count + 1,
        updated_at = now();
end;
$$;
revoke all on function public.record_impressions(uuid[]) from public;
grant execute on function public.record_impressions(uuid[]) to authenticated;

-- ----------------------------------------------------------------------------
-- 12. Signup: hydrate the structured rows from the approved application
-- ----------------------------------------------------------------------------
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
    new.id, app.first_name, app.age, app.city,
    coalesce(app.profession, app.occupation, ''),
    app.school, app.degree, coalesce(app.bio, ''),
    coalesce(app.communities, '{}'), true,
    '№ 0' || lpad(floor(random() * 9000 + 1000)::text, 4, '0'),
    app.score
  );

  insert into public.member_private (user_id, area_id, school, occupation, employer, employment_status)
  values (
    new.id,
    app.area_id,
    coalesce(app.school, ''),
    coalesce(app.profession, app.occupation, ''),
    coalesce(app.company, ''),
    case when app.company is not null and app.company <> '' then 'employed' end
  )
  on conflict (user_id) do nothing;

  insert into public.member_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.recommendation_signals (profile_id) values (new.id)
  on conflict (profile_id) do nothing;

  update public.applications
     set status = 'claimed',
         claimed_by = new.id,
         updated_at = now()
   where id = app.id;

  return new;
end;
$$;

-- Backfill members who signed up before this migration.
insert into public.member_private (user_id, occupation)
select id, coalesce(occupation, '') from public.profiles
on conflict (user_id) do nothing;

insert into public.member_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

insert into public.recommendation_signals (profile_id)
select id from public.profiles
on conflict (profile_id) do nothing;

update public.profiles set display_area = 'Metro Atlanta' where display_area is null;

-- ----------------------------------------------------------------------------
-- 13. Application submission: accept an area, keep the committee-owned
--     columns out of reach (same allowlist design as 012).
-- ----------------------------------------------------------------------------
create or replace function public.submit_application(p_payload jsonb)
returns table (status_token text, email text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  area_name text;
begin
  if coalesce(p_payload ->> 'email', '') = '' or coalesce(p_payload ->> 'first_name', '') = '' then
    raise exception 'Email and first name are required' using errcode = '22023';
  end if;

  select a.name into area_name from public.areas a where a.id = p_payload ->> 'area_id';

  return query
  insert into public.applications (
    email, first_name, age, city, area_id, occupation, school, degree, bio, link, why,
    communities, profession, company, linkedin_url, years_experience,
    age_confirmed, terms_version, privacy_version, consented_at
  ) values (
    p_payload ->> 'email',
    p_payload ->> 'first_name',
    nullif(p_payload ->> 'age', '')::integer,
    coalesce(area_name, nullif(p_payload ->> 'city', '')),
    case when area_name is not null then p_payload ->> 'area_id' end,
    nullif(p_payload ->> 'occupation', ''),
    nullif(p_payload ->> 'school', ''),
    nullif(p_payload ->> 'degree', ''),
    nullif(p_payload ->> 'bio', ''),
    nullif(p_payload ->> 'link', ''),
    nullif(p_payload ->> 'why', ''),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_payload -> 'communities', '[]'::jsonb)) x),
      '{}'::text[]),
    nullif(p_payload ->> 'profession', ''),
    nullif(p_payload ->> 'company', ''),
    nullif(p_payload ->> 'linkedin_url', ''),
    nullif(p_payload ->> 'years_experience', '')::integer,
    (p_payload ->> 'age_confirmed')::boolean,
    nullif(p_payload ->> 'terms_version', ''),
    nullif(p_payload ->> 'privacy_version', ''),
    case when p_payload ? 'age_confirmed' then now() end
  )
  returning applications.status_token, applications.email;
end;
$$;
revoke all on function public.submit_application(jsonb) from public;
grant execute on function public.submit_application(jsonb) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 14. Realtime: the clients subscribe to these tables.
-- ----------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.introduction_requests;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.posts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
