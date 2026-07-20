-- =====================================================
-- kbridge - Public application submit RPC
-- Run this in the Supabase SQL Editor AFTER 001-011.
--
-- WHY THIS EXISTS
-- The apply form used to do:
--     insert into applications (...) returning status_token, email
-- (supabase-js `.insert(row).select('status_token, email')`).
--
-- Anon has an INSERT policy ("anyone_can_apply", migration 002) but no
-- SELECT policy - the only SELECT policies are admin-only or
-- authenticated-own-email. Postgres applies SELECT policies to an INSERT's
-- RETURNING output, so the insert itself succeeded while reading the row
-- back raised 42501 "new row violates row-level security policy". The apply
-- form was unusable on both web and mobile.
--
-- Widening SELECT for anon is not an option: it would expose every
-- application in the table. Instead we mirror the pattern already used by
-- get_application_status / get_application_for_signup (migration 002) - a
-- security definer function that returns exactly the two fields the client
-- needs and nothing else.
--
-- SECURITY: the insert column list is an explicit allowlist. Committee-owned
-- columns (status, score, internal_note, decided_at, decided_by, claimed_by)
-- are deliberately absent, so a caller cannot self-approve by putting
-- "status":"approved" in the payload. status_token keeps its table default.
-- =====================================================

create or replace function public.submit_application(p_payload jsonb)
returns table (status_token text, email text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_email text := lower(trim(coalesce(p_payload ->> 'email', '')));
  v_first text := trim(coalesce(p_payload ->> 'first_name', ''));
begin
  if v_email = '' then
    raise exception 'Email is required.' using errcode = '22023';
  end if;
  if v_first = '' then
    raise exception 'First name is required.' using errcode = '22023';
  end if;

  return query
  insert into public.applications (
    email, first_name, age, city, occupation, school, degree, bio, link, why,
    communities, profession, company, linkedin_url, years_experience,
    age_confirmed, terms_version, privacy_version, consented_at
  )
  values (
    v_email,
    v_first,
    nullif(p_payload ->> 'age', '')::integer,
    nullif(p_payload ->> 'city', ''),
    nullif(p_payload ->> 'occupation', ''),
    nullif(p_payload ->> 'school', ''),
    nullif(p_payload ->> 'degree', ''),
    nullif(p_payload ->> 'bio', ''),
    nullif(p_payload ->> 'link', ''),
    nullif(p_payload ->> 'why', ''),
    coalesce(
      case when jsonb_typeof(p_payload -> 'communities') = 'array'
           then array(select jsonb_array_elements_text(p_payload -> 'communities'))
      end,
      '{}'::text[]
    ),
    nullif(p_payload ->> 'profession', ''),
    nullif(p_payload ->> 'company', ''),
    nullif(p_payload ->> 'linkedin_url', ''),
    nullif(p_payload ->> 'years_experience', '')::integer,
    (p_payload ->> 'age_confirmed')::boolean,
    nullif(p_payload ->> 'terms_version', ''),
    nullif(p_payload ->> 'privacy_version', ''),
    -- Server-stamped: consent time is legal evidence, so it must not come
    -- from a client clock. Null unless consent was actually submitted.
    case when p_payload ? 'age_confirmed' then now() end
  )
  returning applications.status_token, applications.email;
end;
$$;

-- Same grant shape as the other public application RPCs in migration 002.
revoke all on function public.submit_application(jsonb) from public;
grant execute on function public.submit_application(jsonb) to anon, authenticated;
