-- ============================================================================
-- 015_discovery_passes.sql
--
-- "Not now" on Home. A pass hides that member from the viewer's discovery
-- pool for 30 days, one-directionally: the passed member still sees the
-- viewer and may still write to them. Reuses the swipes table from 007 with
-- direction = 'pass'; the old like / mutual-match path is not part of Peaches
-- and nothing writes 'like' rows.
--
--   * pass_member(uuid)         security-definer upsert of the pass, so a
--                               member can pass again once an old pass expired
--                               (swipes has no update policy by design).
--   * get_discovery_candidates  restated from 013 with the pass exclusion.
--
-- Idempotent; safe to re-run.
-- ============================================================================

create or replace function public.pass_member(p_member uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_member = auth.uid() then
    raise exception 'You cannot pass on yourself' using errcode = '22023';
  end if;
  insert into public.swipes (swiper_id, swipee_id, direction)
  values (auth.uid(), p_member, 'pass')
  on conflict (swiper_id, swipee_id) do update
    set direction = 'pass', created_at = now();
end;
$$;
revoke all on function public.pass_member(uuid) from public;
grant execute on function public.pass_member(uuid) to authenticated;

create index if not exists swipes_recent_passes
  on public.swipes (swiper_id, swipee_id, created_at)
  where direction = 'pass';

-- ----------------------------------------------------------------------------
-- Discovery pool: 013's function plus "not passed in the last 30 days".
-- Keep this body in sync with 013 if the pool logic changes again.
-- ----------------------------------------------------------------------------
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
