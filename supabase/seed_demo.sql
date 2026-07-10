-- =====================================================
-- kbridge — Demo / App Review seed
-- Run in the Supabase SQL Editor AFTER migrations 001–011.
--
-- Apple's reviewer cannot get past the application → committee-approval gate
-- on their own, so this creates a ready-to-use reviewer account plus enough
-- other members to populate Discover, and one existing match + conversation so
-- Matches and chat aren't empty. Put these credentials in App Review notes:
--
--   email:    review@kbridge.app
--   password: review123
--
-- Idempotent: safe to re-run. To remove the demo data later, delete the
-- auth.users rows for review@kbridge.app and demo1..demo6@kbridge.app (cascades
-- to profiles, matches, messages).
-- =====================================================

-- Helper: create an approved application + auth user + profile score for one
-- person. The auth.users insert fires handle_new_user (migration 002/010),
-- which needs the approved application to already exist — hence app first.
create or replace function public._seed_member(
  p_email text, p_first text, p_age int, p_city text, p_occ text,
  p_degree text, p_school text, p_bio text, p_score numeric, p_login boolean
) returns uuid
language plpgsql
as $$
declare
  v_user uuid;
begin
  insert into public.applications (email, status, first_name, age, city, occupation, degree, school, bio, why, score, decided_at)
  values (lower(p_email), 'approved', p_first, p_age, p_city, p_occ, p_degree, p_school, p_bio, 'Seed member.', p_score, now())
  on conflict do nothing;

  select id into v_user from auth.users where email = lower(p_email);
  if v_user is null then
    v_user := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user, 'authenticated', 'authenticated',
      lower(p_email), crypt('review123', gen_salt('bf')), now(),
      now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
      '', '', '', ''
    );
    -- Only accounts that need to sign in require an identities row.
    if p_login then
      insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      values (
        gen_random_uuid(), v_user,
        jsonb_build_object('sub', v_user::text, 'email', lower(p_email), 'email_verified', true),
        'email', v_user::text, now(), now(), now()
      );
    end if;
  end if;

  -- handle_new_user created the profile from the application; stamp the score
  -- explicitly so this works regardless of which trigger version is installed.
  update public.profiles
     set score = p_score, onboarding_complete = true
   where id = v_user;

  return v_user;
end;
$$;

-- ── Reviewer + six in-band members (scores within ±2.5 of 6.0) ────────────
do $$
declare
  v_review uuid;
  v_demo1  uuid;
  v_match  uuid;
begin
  v_review := public._seed_member('review@kbridge.app','Alex',30,'New York','Product designer','B.F.A.','RISD','Designer, reader, and aspiring potter. Here for something real.',6.0,true);

  v_demo1  := public._seed_member('demo1@kbridge.app','Mara',29,'Brooklyn','Architect','M.Arch','Yale','I like old buildings and new ideas.',6.5,false);
  perform public._seed_member('demo2@kbridge.app','Julian',33,'Manhattan','Attorney','J.D.','Columbia','Litigator by day, jazz pianist by night.',5.5,false);
  perform public._seed_member('demo3@kbridge.app','Priya',31,'Jersey City','Physician','M.D.','NYU','ER doctor. I recharge with long trail runs.',7.0,false);
  perform public._seed_member('demo4@kbridge.app','Theo',28,'Queens','Software engineer','B.S.','Carnegie Mellon','Building things and chasing good espresso.',4.8,false);
  perform public._seed_member('demo5@kbridge.app','Camille',32,'New York','Gallery director','B.A.','Brown','I curate by day and cook far too much by night.',6.2,false);
  perform public._seed_member('demo6@kbridge.app','Daniel',34,'Hoboken','Founder','M.B.A.','Wharton','Second-time founder. Optimist. Terrible at chess.',7.4,false);

  -- One existing match + conversation so Matches / chat are populated.
  if v_review is not null and v_demo1 is not null then
    select id into v_match from public.matches
     where (user_a = v_review and user_b = v_demo1) or (user_a = v_demo1 and user_b = v_review)
     limit 1;
    if v_match is null then
      insert into public.matches (user_a, user_b) values (v_review, v_demo1) returning id into v_match;
      insert into public.messages (match_id, sender_id, body) values
        (v_match, v_demo1,  'So glad we matched — your bio made me smile.'),
        (v_match, v_review, 'Likewise! What''s your ideal Sunday?'),
        (v_match, v_demo1,  'Slow coffee, a long walk, and a good bookshop.');
    end if;
  end if;
end $$;

drop function public._seed_member(text, text, int, text, text, text, text, text, numeric, boolean);

-- ── Verify (reviewer should see 5 people in Discover, 1 in Matches) ───────
select 'reviewer' as who, email, (select score from public.profiles where id = u.id) as score
from auth.users u where email = 'review@kbridge.app'
union all
select 'members', count(*)::text, null from public.profiles p
where p.onboarding_complete and p.id <> (select id from auth.users where email = 'review@kbridge.app');
