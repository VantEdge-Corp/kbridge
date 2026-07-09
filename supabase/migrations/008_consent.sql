-- =====================================================
-- kbridge — Consent records (Terms of Service + Privacy Policy)
-- Run this in the Supabase SQL Editor AFTER 001–007.
--
-- Clickwrap proof: which document VERSION each person accepted, and when,
-- captured at the two collection points:
--   • applications — atomically with the public apply insert
--   • profiles     — when the account is created at signup
--
-- Membership is decided by human committee review in the admin panel;
-- kbridge does not collect government IDs or run identity-document
-- verification, so there are no verification/biometric columns here. The
-- legacy face_photo_path / passport_photo_path columns from migration 005
-- are left in place (nullable, no longer written) so existing rows keep
-- working.
-- =====================================================

alter table public.applications
  add column if not exists age_confirmed   boolean,
  add column if not exists terms_version   text,
  add column if not exists privacy_version text,
  add column if not exists consented_at    timestamptz;

alter table public.profiles
  add column if not exists terms_version   text,
  add column if not exists privacy_version text,
  add column if not exists consented_at    timestamptz;

-- No RLS changes needed:
--   • applications: the existing "anyone_can_apply" INSERT policy (with
--     check true, migration 002) already covers these columns, so the apply
--     form writes them in the same insert.
--   • profiles: the existing "Own profile full access" policy (migration 001)
--     lets a signed-in member write their own consent columns at signup.
--
-- Consent is enforced in the app (Apply/Signup disable submit until the
-- boxes are checked). Columns are nullable so this migration is
-- non-destructive to existing rows.
