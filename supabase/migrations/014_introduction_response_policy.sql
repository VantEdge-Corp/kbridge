-- ============================================================================
-- 014_introduction_response_policy.sql
--
-- Fix: recipients could not accept or decline, and requesters could not
-- withdraw. The update policy from 006 had no WITH CHECK clause, so Postgres
-- re-applied its USING condition (status = 'pending') to the updated row and
-- every status change failed with "new row violates row-level security
-- policy". Split it into one policy per side, each stating the statuses that
-- side may move a pending request to. Idempotent; safe to re-run.
-- ============================================================================

drop policy if exists "Update own intro request" on public.introduction_requests;
drop policy if exists "Recipient responds to intro request" on public.introduction_requests;
drop policy if exists "Requester withdraws intro request" on public.introduction_requests;

create policy "Recipient responds to intro request"
  on public.introduction_requests
  for update
  using (auth.uid() = recipient_id and status = 'pending')
  with check (auth.uid() = recipient_id and status in ('accepted', 'declined'));

create policy "Requester withdraws intro request"
  on public.introduction_requests
  for update
  using (auth.uid() = requester_id and status = 'pending')
  with check (auth.uid() = requester_id and status = 'withdrawn');
