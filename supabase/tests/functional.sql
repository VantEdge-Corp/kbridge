-- ============================================================================
-- supabase/tests/functional.sql
-- Functional checks for the Peaches model (migration 013), run against a
-- local Supabase stack with migrations 001-016 applied:
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/functional.sql
--
-- Everything runs inside one transaction and rolls back, so it is safe on a
-- seeded database. Each check raises on failure; a clean run prints only the
-- "ok:" notices.
-- ============================================================================
\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.mk_member(p_email text, p_first text, p_age int, p_area text) returns uuid
language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  insert into public.applications (email, first_name, age, area_id, profession, company, status, decided_at)
  values (p_email, p_first, p_age, p_area, 'Analyst', 'Acme', 'approved', now());
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', p_email,
          crypt('test-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
  return uid;
end $$;

create or replace function pg_temp.check(p_name text, p_ok boolean) returns void
language plpgsql as $$
begin
  if not coalesce(p_ok, false) then
    raise exception 'FAILED: %', p_name;
  end if;
  raise notice 'ok: %', p_name;
end $$;

create or replace function pg_temp.act_as(p_user uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_user::text, true);
end $$;

-- Runs p_sql and passes only if it fails with a message like p_message. Rules
-- refuse with the same error code as a failed check, so the message decides.
create or replace function pg_temp.check_refused(p_name text, p_sql text, p_message text) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm like p_message then
      raise notice 'ok: %', p_name;
      return;
    end if;
    raise exception 'FAILED: % (refused with: %)', p_name, sqlerrm;
  end;
  raise exception 'FAILED: % (it was allowed)', p_name;
end $$;

select pg_temp.mk_member('t_alice@peaches.test', 'Alice', 29, 'midtown-atlanta') as alice \gset
select pg_temp.mk_member('t_ben@peaches.test', 'Ben', 33, 'duluth') as ben \gset
select pg_temp.mk_member('t_cara@peaches.test', 'Cara', 27, 'athens') as cara \gset
select pg_temp.mk_member('t_dev@peaches.test', 'Dev', 31, 'decatur') as dev \gset

-- Signup hydration created the companion rows.
select pg_temp.check('signup creates member_private, preferences and signals',
  (select count(*) from public.member_private where user_id in (:'alice', :'ben', :'cara')) = 3
  and (select count(*) from public.member_preferences where user_id in (:'alice', :'ben', :'cara')) = 3
  and (select count(*) from public.recommendation_signals where profile_id in (:'alice', :'ben', :'cara')) = 3);

-- Derived public display strings follow the private rows and display toggles.
update public.member_private
   set school = 'Georgia Tech', degree_level = 'master', field_of_study = 'Computer Science',
       employer = 'Mailchimp', employer_display_enabled = true
 where user_id = :'ben';
select pg_temp.check('derived display strings',
  (select employment_display = 'Analyst · Mailchimp'
      and education_display = 'Georgia Tech · Master''s, Computer Science'
      and education_degree_level = 'master'
      and display_area = 'Duluth area'
     from public.profiles where id = :'ben'));

update public.member_private set employer_display_enabled = false, education_display_enabled = false where user_id = :'ben';
select pg_temp.check('display toggles hide employer and education',
  (select employment_display = 'Analyst' and education_display is null and education_degree_level is null
     from public.profiles where id = :'ben'));
update public.member_private set employer_display_enabled = true, education_display_enabled = true where user_id = :'ben';

-- Regression: an idempotent "ensure row" insert must not wipe derived fields.
insert into public.member_private (user_id) values (:'ben') on conflict (user_id) do nothing;
select pg_temp.check('on conflict do nothing keeps derived fields',
  (select employment_display = 'Analyst · Mailchimp' and display_area = 'Duluth area'
     from public.profiles where id = :'ben'));

update public.member_private set max_distance_miles = 30 where user_id = :'alice';
update public.profiles
   set nationalities = '{KR,US}', languages = '{en,ko}', race_ethnicities = '{east_asian}',
       race_ethnicity_disclosure = 'disclosed', height_cm = 178
 where id = :'ben';
update public.member_preferences
   set prefs = '{"ageRange":{"strength":"preferred","min":25,"max":32},"languages":{"strength":"preferred","values":["ko"]}}'
 where user_id = :'ben';

-- Row security as Alice.
set local role authenticated;
select pg_temp.act_as(:'alice');
select pg_temp.check('members read only their own profiles row', (select count(*) from public.profiles) = 1);
select pg_temp.check('members read others through public_profiles',
  (select count(*) from public.public_profiles where id in (:'ben', :'cara')) = 2);
select pg_temp.check('public_profiles derives the area label live',
  (select display_area = 'Duluth area' from public.public_profiles where id = :'ben'));
select pg_temp.check('member_private is owner-only', (select count(*) from public.member_private) = 1);
select pg_temp.check('member_preferences is owner-only', (select count(*) from public.member_preferences) = 1);
select pg_temp.check('recommendation_signals is not readable',
  not exists (select 1 from information_schema.role_table_grants
               where table_name = 'recommendation_signals' and grantee = 'authenticated' and privilege_type = 'SELECT'));

-- Discovery: Ben (Duluth, ~20 mi) is in Alice's 30-mile pool, Cara (Athens) is not.
select pg_temp.check('discovery respects the distance boundary',
  exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'ben'::uuid and distance_miles between 15 and 30)
  and not exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'cara'::uuid));
select pg_temp.check('reverse compatibility is computed from the candidate''s private preferences',
  (select reverse_compatibility = 1.00 and reverse_eligible
     from public.get_discovery_candidates(500) where profile_id = :'ben'::uuid));
select public.record_impressions(array[:'ben'::uuid]);
select public.record_impressions(array[:'ben'::uuid]);
select pg_temp.check('impressions are bucketed',
  (select exposure_bucket = 2 from public.get_discovery_candidates(500) where profile_id = :'ben'::uuid));

-- "Not now": a pass hides Dev from Alice for a while, and only from Alice.
select pg_temp.check('a nearby member is in the pool before a pass',
  exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'dev'::uuid));
select public.pass_member(:'dev');
select public.pass_member(:'dev');
select pg_temp.check('a pass removes the member from the viewer''s pool',
  not exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'dev'::uuid));
do $$
begin
  perform public.pass_member(auth.uid());
  raise exception 'FAILED: a member passed on themselves';
exception when invalid_parameter_value then
  raise notice 'ok: passing on yourself is refused';
end $$;

-- A pending request removes the pair from both pools.
insert into public.introduction_requests (requester_id, recipient_id, note)
values (:'alice', :'ben', 'Hello Ben, I noticed we both play tennis around Midtown.');
select pg_temp.check('a pending request removes the candidate',
  not exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'ben'::uuid));

select public.request_verification('education');
select pg_temp.check('members can request verification',
  (select verification_education = 'pending' from public.profiles where id = :'alice'));
select pg_temp.check('pending states never appear publicly',
  (select verified_badges = '{}' from public.public_profiles where id = :'ben'));

-- As Ben: the request is in his inbox, Alice is out of his pool, admin functions are refused.
select pg_temp.act_as(:'ben');
select pg_temp.check('the recipient sees the pending request',
  (select count(*) from public.introduction_requests where recipient_id = auth.uid() and status = 'pending') = 1);
select pg_temp.check('the requester is out of the recipient''s pool',
  not exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'alice'::uuid));
select pg_temp.act_as(:'dev');
select pg_temp.check('a pass is one-directional: the passed member still sees the viewer',
  exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'alice'::uuid));
select pg_temp.act_as(:'ben');

-- Responding: the recipient may accept (which opens a connection) but never withdraw; the requester may only withdraw.
do $$
begin
  update public.introduction_requests set status = 'withdrawn' where recipient_id = auth.uid();
  raise exception 'FAILED: the recipient withdrew a request';
exception when insufficient_privilege then
  raise notice 'ok: the recipient cannot withdraw';
end $$;
update public.introduction_requests set status = 'accepted' where recipient_id = auth.uid() and status = 'pending';
select pg_temp.check('the recipient accepts and a connection opens',
  (select status = 'accepted' and match_id is not null and responded_at is not null
     from public.introduction_requests where recipient_id = auth.uid())
  and exists (select 1 from public.matches where (user_a = :'alice'::uuid and user_b = auth.uid()) or (user_a = auth.uid() and user_b = :'alice'::uuid)));
insert into public.introduction_requests (requester_id, recipient_id, note)
values (auth.uid(), :'cara', 'Hi Cara, your Athens weekend posts read like a guidebook.');
update public.introduction_requests set status = 'withdrawn' where requester_id = auth.uid() and recipient_id = :'cara' and status = 'pending';
select pg_temp.check('the requester withdraws',
  (select status = 'withdrawn' and responded_at is not null from public.introduction_requests where requester_id = auth.uid() and recipient_id = :'cara'));
do $$
begin
  perform public.set_verification(auth.uid(), 'identity', 'verified');
  raise exception 'FAILED: set_verification allowed for a non-admin';
exception when insufficient_privilege then
  raise notice 'ok: set_verification refused for non-admins';
end $$;

insert into public.posts (author_id, body) values (auth.uid(), 'Anyone up for a Saturday BeltLine walk and coffee?');
select pg_temp.check('members read visible posts', (select count(*) from public.posts where author_id = auth.uid()) = 1);

-- Blocks hide people and posts in both directions.
insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), :'cara');
select pg_temp.act_as(:'cara');
select pg_temp.check('a block hides the blocker''s posts from the blocked member',
  (select count(*) from public.posts where author_id = :'ben'::uuid) = 0);
select pg_temp.check('a block removes both members from each other''s pools',
  not exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'ben'::uuid));

-- 016: demo members live apart from real ones.
reset role;
select pg_temp.mk_member('t_dana@peaches.test', 'Dana', 30, 'midtown-atlanta') as dana \gset
select pg_temp.mk_member('t_eli@peaches.test', 'Eli', 32, 'midtown-atlanta') as eli \gset
update public.profiles set is_demo = true where id in (:'dana', :'eli');
insert into public.posts (author_id, body) values (:'dana', 'Brunch at Ponce City Market this Sunday?');
-- The seed runs as the database owner with no signed-in member; the guard still compares both sides.
select set_config('request.jwt.claims', '', true), set_config('request.jwt.claim.sub', '', true);
select pg_temp.check_refused('the seed cannot connect a real member to a demo member',
  format('insert into public.introduction_requests (requester_id, recipient_id, note) values (%L, %L, %L)',
         :'dev', :'dana', 'Hi Dana, brunch sounds lovely.'),
  'This member isn''t available%');

set local role authenticated;
select pg_temp.act_as(:'alice');
select pg_temp.check('real members never see demo members',
  not exists (select 1 from public.public_profiles where id in (:'dana', :'eli'))
  and not exists (select 1 from public.get_discovery_candidates(500) where profile_id in (:'dana'::uuid, :'eli'::uuid))
  and not exists (select 1 from public.posts where author_id = :'dana'::uuid));
select pg_temp.check_refused('a real member cannot write to a demo member',
  format('insert into public.introduction_requests (requester_id, recipient_id, note) values (%L, %L, %L)',
         :'alice', :'dana', 'Hello Dana, brunch sounds great.'),
  'This member isn''t available%');

select pg_temp.act_as(:'dana');
select pg_temp.check('demo members see only demo members',
  exists (select 1 from public.public_profiles where id = :'eli'::uuid)
  and not exists (select 1 from public.public_profiles where id in (:'alice', :'ben'))
  and exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'eli'::uuid)
  and not exists (select 1 from public.get_discovery_candidates(500) where profile_id = :'alice'::uuid)
  and not exists (select 1 from public.posts where author_id = :'alice'::uuid));
insert into public.introduction_requests (requester_id, recipient_id, note)
values (:'dana', :'eli', 'Hi Eli, want to try the new ramen place on Buford Highway?');
select pg_temp.check('demo members can write to each other',
  exists (select 1 from public.introduction_requests where requester_id = :'dana'::uuid and recipient_id = :'eli'::uuid));

-- 016: objectionable text. Alice and Ben have an open conversation from above.
select pg_temp.act_as(:'alice');
select pg_temp.check_refused('telling someone to kill themselves is refused even in private messages',
  format('insert into public.messages (match_id, sender_id, body) select id, %L, %L from public.matches where %L in (user_a, user_b) limit 1',
         :'alice', 'honestly just kill yourself', :'alice'),
  'That includes language we don''t allow%');
insert into public.messages (match_id, sender_id, body)
select id, :'alice', 'That hike was fucking steep, worth it though.' from public.matches where :'alice' in (user_a, user_b) limit 1;
select pg_temp.check('strong profanity is allowed in a private conversation',
  exists (select 1 from public.messages where sender_id = :'alice'::uuid and body like 'That hike%'));
select pg_temp.check_refused('strong profanity is refused in a post',
  format('insert into public.posts (author_id, body) values (%L, %L)', :'alice', 'What the fuck is this traffic'),
  'That includes language we don''t allow%');
select pg_temp.check_refused('an explicit term is refused in a comment',
  format('insert into public.post_comments (post_id, author_id, body) select id, %L, %L from public.posts where author_id = %L limit 1',
         :'alice', 'send nudes', :'ben'),
  'That includes language we don''t allow%');
select pg_temp.check_refused('stretched spellings are refused in an introduction note',
  format('insert into public.introduction_requests (requester_id, recipient_id, note) values (%L, %L, %L)',
         :'alice', :'cara', 'Hi Cara, fuuuuck it, let''s get coffee'),
  'That includes language we don''t allow%');
insert into public.posts (author_id, body)
values (:'alice', 'Class reunion cocktails: magna cum laude grads from Scunthorpe, a pedometer, and Dickens.');
select pg_temp.check('words that merely contain a listed word are allowed',
  exists (select 1 from public.posts where author_id = :'alice'::uuid and body like 'Class reunion%'));
select pg_temp.check_refused('a bio edit with a listed word is refused',
  format('update public.profiles set bio = %L where id = %L', 'Looking for a fuck buddy', :'alice'),
  'That includes language we don''t allow%');

-- Text saved before a word was listed never blocks other edits or activity pings.
reset role;
set local session_replication_role = replica;
update public.profiles set bio = 'Old bio: this traffic is shit and fucking slow' where id = :'alice';
set local session_replication_role = origin;
set local role authenticated;
select pg_temp.act_as(:'alice');
select public.touch_last_active();
update public.profiles set interests = '{Hiking,Coffee}' where id = :'alice';
select pg_temp.check('unchanged text does not block other edits',
  (select interests = '{Hiking,Coffee}' from public.profiles where id = :'alice'));

reset role;
select pg_temp.check('normalization lowercases, collapses spaces, and maps look-alikes',
  public.objectionable_term('Kill   YOURSELF', false) is not null
  and public.objectionable_term('k1ll y0urs3lf', false) is not null
  and public.objectionable_term('A pedometer and a bitchin'' playlist', false) is null);

reset role;
rollback;
