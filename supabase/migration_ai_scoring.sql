-- ─────────────────────────────────────────────────────────────────────────────
-- Lineage — Migration: AI scoring + admin approval fields
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- Applicant nationality and passport
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nationality         text,
  ADD COLUMN IF NOT EXISTS passport_country    text;

-- AI portrait scoring
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS appearance_score            numeric(4,2),
  ADD COLUMN IF NOT EXISTS appearance_score_breakdown  jsonb;

-- Committee approval workflow
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS application_status  text DEFAULT 'pending'
    CHECK (application_status IN ('pending','approved','rejected','waitlisted')),
  ADD COLUMN IF NOT EXISTS approved_at         timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by         uuid REFERENCES auth.users(id);

-- Index for fast admin queue queries
CREATE INDEX IF NOT EXISTS idx_profiles_application_status
  ON profiles (application_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_appearance_score
  ON profiles (appearance_score DESC NULLS LAST);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: only service role / admin can update application_status
-- (Optional — tighten if you want applicants unable to self-approve)
-- ─────────────────────────────────────────────────────────────────────────────

-- Allow admins (identified by is_admin flag on profiles) to read all profiles
-- CREATE POLICY "admin_read_all" ON profiles
--   FOR SELECT USING (
--     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
--   );
