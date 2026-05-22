-- =====================================================
-- Lineage — Verification Fields + Storage Bucket
-- Run AFTER 001, 002, 003, 004.
--
-- Adds profession-oriented application fields and storage paths
-- for the two required photo uploads (face + US passport). The
-- storage bucket itself ('verifications') is private; anonymous
-- applicants can write, only admins can read.
--
-- Real face/document verification (liveness, OCR, anti-spoof)
-- would slot in via Persona / Onfido / Veriff — those services
-- write their result into applications.payload and gate the
-- admin "Admit" button. For now this is admin-reviewed photo
-- upload.
-- =====================================================

-- ── 1. New application fields ────────────────────────────
alter table public.applications
  add column if not exists profession          text,
  add column if not exists company             text,
  add column if not exists linkedin_url        text,
  add column if not exists years_experience    integer,
  add column if not exists face_photo_path     text,
  add column if not exists passport_photo_path text;

-- ── 2. Storage bucket (private) ──────────────────────────
-- If you prefer the UI, you can also create this manually in
-- Supabase Dashboard → Storage → New bucket. Make sure it is
-- NOT marked public.
insert into storage.buckets (id, name, public)
  values ('verifications', 'verifications', false)
  on conflict (id) do nothing;

-- ── 3. Storage RLS ───────────────────────────────────────
-- public.is_admin() (from migration 004) is callable here
-- because it is SECURITY DEFINER.

drop policy if exists "anon_upload_verifications" on storage.objects;
create policy "anon_upload_verifications" on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'verifications');

drop policy if exists "admins_read_verifications" on storage.objects;
create policy "admins_read_verifications" on storage.objects
  for select
  to authenticated
  using (bucket_id = 'verifications' and public.is_admin());

drop policy if exists "admins_delete_verifications" on storage.objects;
create policy "admins_delete_verifications" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'verifications' and public.is_admin());
