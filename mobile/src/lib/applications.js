// ─────────────────────────────────────────────────────────────────────────────
// applications.js — Public application flow (apply / status / signup).
// Mirrors the web contract (src/lib/applications.js). Membership is decided by
// committee review of the written application; no ID/photo verification.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase.js';

const TABLE = 'applications';

export const PUBLIC_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  WAITLISTED: 'waitlisted',
  CLAIMED: 'claimed',
});

export async function submitApplication(fields) {
  if (!fields?.email) throw new Error('Email is required.');
  if (!fields?.first_name) throw new Error('First name is required.');

  const row = {
    email:            fields.email.trim().toLowerCase(),
    first_name:       fields.first_name.trim(),
    age:              fields.age ?? null,
    city:             fields.city ?? null,
    occupation:       fields.occupation ?? null,
    school:           fields.school ?? null,
    degree:           fields.degree ?? null,
    bio:              fields.bio ?? null,
    link:             fields.link ?? null,
    why:              fields.why ?? null,
    communities:      Array.isArray(fields.communities) ? fields.communities : [],
    profession:       fields.profession ?? null,
    company:          fields.company ?? null,
    linkedin_url:     fields.linkedin_url ?? null,
    years_experience: fields.years_experience ?? null,
  };

  // Proof of consent — which document versions the applicant accepted, and when.
  if (fields.consent) {
    row.age_confirmed   = !!fields.consent.ageConfirmed;
    row.terms_version   = fields.consent.termsVersion ?? null;
    row.privacy_version = fields.consent.privacyVersion ?? null;
    row.consented_at    = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select('status_token, email')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('An application from this email is already on file.');
    }
    throw new Error(error.message || 'Could not submit application.');
  }

  return data;
}

export async function getApplicationStatusByToken(token) {
  if (!token) return null;
  const { data, error } = await supabase
    .rpc('get_application_status', { p_token: token.trim() });
  if (error) throw new Error(error.message || 'Could not load status.');
  return Array.isArray(data) && data.length ? data[0] : null;
}

export async function getApplicationForSignup(token) {
  if (!token) return null;
  const { data, error } = await supabase
    .rpc('get_application_for_signup', { p_token: token.trim() });
  if (error) throw new Error(error.message || 'Could not load application.');
  return Array.isArray(data) && data.length ? data[0] : null;
}

// Best-effort consent record on the new profile at signup. The same
// acceptance is already stored on the approved application, so a failure
// here is non-fatal.
export async function recordProfileConsent(userId, versions) {
  if (!userId) return;
  try {
    await supabase.from('profiles').update({
      terms_version: versions.terms,
      privacy_version: versions.privacy,
      consented_at: new Date().toISOString(),
    }).eq('id', userId);
  } catch {
    // non-fatal
  }
}
