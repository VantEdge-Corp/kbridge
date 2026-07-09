-- =====================================================
-- kbridge — Real profile photos (+ verified-badge flag)
-- Run this in the Supabase SQL Editor AFTER 001–008.
--
-- Replaces the mocked gradient portraits with real uploaded photos, and
-- reserves a photo_verified flag for a future "Photo Verified" badge (a
-- liveness/selfie-match check performed by a third-party vendor — the
-- biometric data would live with the vendor, not here; we'd store only the
-- boolean result). This migration adds NO biometric data or columns.
-- =====================================================

alter table public.profiles
  add column if not exists photo_paths       text[]  default '{}',
  add column if not exists photo_verified    boolean not null default false,
  add column if not exists photo_verified_at timestamptz;

-- ── Storage bucket ────────────────────────────────────────
-- Public bucket with unguessable per-user UUID paths: profile photos are
-- meant to be seen by other members (in the deck / on profiles), and a public
-- bucket lets clients render them by URL without per-image signed URLs. Paths
-- are <user_id>/<uuid>.<ext>, so they aren't enumerable. If you later want
-- strictly members-only photos, flip the bucket to private and switch the
-- clients to createSignedUrl().
insert into storage.buckets (id, name, public)
  values ('profile-photos', 'profile-photos', true)
  on conflict (id) do nothing;

-- ── Storage RLS ───────────────────────────────────────────
-- Reads are public (public bucket). Writes are restricted to the member's own
-- folder: the first path segment must equal their auth uid.
drop policy if exists "own_photos_insert" on storage.objects;
create policy "own_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own_photos_update" on storage.objects;
create policy "own_photos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "own_photos_delete" on storage.objects;
create policy "own_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
