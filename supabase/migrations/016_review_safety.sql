-- ============================================================================
-- 016_review_safety.sql: what App Store and Google Play review ask of a dating
-- app with member-written content. Run after 001-015. Idempotent: safe to re-run.
--
-- 1. Demo members live apart from real ones. seed_demo.sql creates fictional
--    members for app review and development; a real member must never see
--    them, and a demo account must never reach a real member. Every profile
--    carries is_demo, and every place that shows one member to another
--    compares the two sides: the public profile view, discovery, the feed,
--    comments, and introduction requests. Messages follow, because a
--    conversation only opens from an accepted request.
--
-- 2. Objectionable text is refused where it is written. A short list of
--    patterns lives in public.moderation_terms (editable in the SQL editor):
--      scope 'all'    slurs, sexual content involving minors, telling someone
--                     to kill themselves. Refused everywhere, private
--                     messages included.
--      scope 'public' strong profanity, explicit sexual terms, adult-content
--                     sites. Refused where people read text before they have
--                     chosen to talk: profiles, posts, comments, and
--                     introduction notes.
--    Reports, blocks, and the committee cover what a list cannot.
--
-- Re-running an earlier migration (013 or 015) replaces the policies and
-- functions restated here; run 016 again afterwards.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Demo members
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists is_demo boolean not null default false;

-- Databases seeded before this migration: every seed account uses @peaches.app.
update public.profiles p
   set is_demo = true
  from auth.users u
 where u.id = p.id
   and u.email like '%@peaches.app'
   and not p.is_demo;

-- True when two members may see each other: both demo or both real. A missing
-- side (the database owner, the service role, the seed) sees everyone.
create or replace function public.same_world(a uuid, b uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select a is null or b is null
      or coalesce((select is_demo from public.profiles where id = a), false)
       = coalesce((select is_demo from public.profiles where id = b), false);
$$;
revoke all on function public.same_world(uuid, uuid) from public;
grant execute on function public.same_world(uuid, uuid) to authenticated;

-- 013's view, restricted to the viewer's side. Admins see everyone.
create or replace view public.public_profiles as
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
  where p.onboarding_complete and p.suspended_at is null
    and (public.same_world(auth.uid(), p.id) or public.is_admin());

revoke all on public.public_profiles from anon, public;
grant select on public.public_profiles to authenticated, service_role;

drop policy if exists "Members read visible posts" on public.posts;
create policy "Members read visible posts"
  on public.posts for select to authenticated
  using (
    author_id = auth.uid()
    or (not public.blocked_between(auth.uid(), author_id)
        and public.member_visible(author_id)
        and public.same_world(auth.uid(), author_id))
  );

drop policy if exists "Members read comments on visible posts" on public.post_comments;
create policy "Members read comments on visible posts"
  on public.post_comments for select to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_id)
    and not public.blocked_between(auth.uid(), author_id)
    and public.same_world(auth.uid(), author_id)
  );

-- 013's guard plus the same-side check. Compares the two members directly, so
-- it holds for the seed and admin scripts too, which run without a signed-in user.
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
  if not public.member_visible(new.recipient_id)
     or not public.same_world(new.requester_id, new.recipient_id) then
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

-- 015's discovery pool plus the same-side check. Keep this body in sync with
-- 015 if the pool logic changes again.
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
       and p.is_demo = coalesce(me_profile.is_demo, false)
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
       and not exists (
         select 1 from public.swipes s
          where s.swiper_id = me and s.swipee_id = p.id
            and s.direction = 'pass'
            and s.created_at > now() - interval '30 days')
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

-- ----------------------------------------------------------------------------
-- 2. Objectionable text
-- ----------------------------------------------------------------------------
-- pattern: a lowercase regular-expression fragment matched as whole words
-- against normalized text (see moderation_normalize). A letter followed by +
-- also catches stretched spellings ("fuuuck").
create table if not exists public.moderation_terms (
  pattern text primary key,
  scope text not null check (scope in ('all', 'public'))
);
alter table public.moderation_terms enable row level security;
revoke all on public.moderation_terms from anon, authenticated;

insert into public.moderation_terms (pattern, scope) values
  -- Slurs
  ('n+i+g+g+(a|ah|as|az|er|ers|uh|uhs)', 'all'),
  ('f+a+g+(o+t+|i+t+)?s?', 'all'),
  ('d+y+k+e+s?', 'all'),
  ('t+r+a+n+n+(y|ie|ies)', 'all'),
  ('r+e+t+a+r+d+(s|e+d)?', 'all'),
  ('c+h+i+n+k+s?', 'all'),
  ('s+p+i+c+k?s?', 'all'),
  ('k+i+k+e+s?', 'all'),
  ('g+o+o+k+s?', 'all'),
  ('w+e+t+b+a+c+k+s?', 'all'),
  ('b+e+a+n+e+r+s?', 'all'),
  ('(towel|rag) ?heads?', 'all'),
  ('porch ?monkeys?', 'all'),
  ('jungle ?bunn(y|ies)', 'all'),
  ('s+h+e+m+a+l+e+s?', 'all'),
  -- Sexual content involving minors
  ('child ?porn(ography)?', 'all'),
  ('kidd(ie|y) ?porn', 'all'),
  ('p+e+d+o+(s|phile|philes|philia)?', 'all'),
  ('lolicon', 'all'),
  ('shotacon', 'all'),
  ('jail ?bait', 'all'),
  ('underage ?(nudes?|sex|pics?|porn)', 'all'),
  -- Telling someone to kill themselves
  ('kys', 'all'),
  ('kill (yo)?ur ?self', 'all'),
  ('kill yo self', 'all'),
  -- Strong profanity
  ('f+u+c+k+(s|e+d|e+r|e+r+s|i+n+g?|i+n)?', 'public'),
  ('m+o+t+h+e+r+ ?f+u+c+k+(a|a+s|e+r|e+r+s|i+n+g?|i+n)', 'public'),
  ('c+u+n+t+s?', 'public'),
  ('b+i+t+c+h+(e+s|y)?', 'public'),
  ('w+h+o+r+e+s?', 'public'),
  ('s+l+u+t+s?', 'public'),
  ('a+s+s+h+o+l+e+s?', 'public'),
  -- Explicit sexual terms and adult-content sites
  ('p+u+s+s+(y|ies)', 'public'),
  ('c+o+c+k+s?', 'public'),
  ('d+i+c+k+ ?p+i+c+s?', 'public'),
  ('t+i+t+s', 'public'),
  ('t+i+t+t+i+e+s', 'public'),
  ('n+u+d+e+s', 'public'),
  ('s+e+x+t+(s|i+n+g)?', 'public'),
  ('b+l+o+w+ ?j+o+b+s?', 'public'),
  ('h+a+n+d+ ?j+o+b+s?', 'public'),
  ('p+o+r+n+h+u+b', 'public'),
  ('x+v+i+d+e+o+s', 'public'),
  ('x+h+a+m+s+t+e+r', 'public'),
  ('o+n+l+y+ ?f+a+n+s', 'public'),
  ('f+a+n+s+l+y', 'public')
on conflict (pattern) do update set scope = excluded.scope;

-- Lowercase, look-alike characters mapped back to letters (0 o, 1 i, 3 e, 4 a,
-- 5 s, 7 t, @ a, $ s), whitespace collapsed.
create or replace function public.moderation_normalize(t text)
returns text
language sql immutable
as $$
  select regexp_replace(translate(lower(coalesce(t, '')), '013457@$', 'oieastas'), '\s+', ' ', 'g');
$$;

-- The first matching pattern, or null. p_public also applies the 'public' scope.
create or replace function public.objectionable_term(t text, p_public boolean)
returns text
language sql stable security definer
set search_path = public
as $$
  select m.pattern
    from public.moderation_terms m
   where (p_public or m.scope = 'all')
     and public.moderation_normalize(t) ~ ('\m(' || m.pattern || ')\M')
   limit 1;
$$;
revoke all on function public.objectionable_term(text, boolean) from public;

-- Trigger: TG_ARGV[0] is 'public' or 'private', the rest are the text columns
-- to check. On update only the columns that changed are checked, so earlier
-- text (a name, or text written before a pattern was added) never blocks an
-- unrelated edit or an activity ping.
create or replace function public.moderate_text()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  new_row jsonb := to_jsonb(new);
  old_row jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  changed text := '';
begin
  for i in 1 .. tg_nargs - 1 loop
    if old_row is null or (new_row -> tg_argv[i]) is distinct from (old_row -> tg_argv[i]) then
      changed := changed || ' ' || coalesce(new_row ->> tg_argv[i], '');
    end if;
  end loop;
  if changed <> '' and public.objectionable_term(changed, tg_argv[0] = 'public') is not null then
    raise exception 'That includes language we don''t allow on Peaches. Please rephrase it.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_moderate_text on public.posts;
create trigger posts_moderate_text
  before insert or update of body on public.posts
  for each row execute function public.moderate_text('public', 'body');

drop trigger if exists post_comments_moderate_text on public.post_comments;
create trigger post_comments_moderate_text
  before insert or update of body on public.post_comments
  for each row execute function public.moderate_text('public', 'body');

drop trigger if exists introduction_requests_moderate_text on public.introduction_requests;
create trigger introduction_requests_moderate_text
  before insert or update of note on public.introduction_requests
  for each row execute function public.moderate_text('public', 'note');

drop trigger if exists messages_moderate_text on public.messages;
create trigger messages_moderate_text
  before insert or update of body on public.messages
  for each row execute function public.moderate_text('private', 'body');

-- Profiles are created from a committee-reviewed application, so only member
-- edits are checked. Job and school lines arrive here through the sync from
-- member_private.
drop trigger if exists profiles_moderate_text on public.profiles;
create trigger profiles_moderate_text
  before update of first_name, bio, occupation, employment_display, education_display, interests
  on public.profiles
  for each row execute function public.moderate_text(
    'public', 'first_name', 'bio', 'occupation', 'employment_display', 'education_display', 'interests');
