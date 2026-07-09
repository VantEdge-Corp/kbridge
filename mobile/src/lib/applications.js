// ─────────────────────────────────────────────────────────────────────────────
// applications.js — Public application flow (apply / status / signup).
// Port of the web app's src/lib/applications.js, public surface only —
// the admin queue stays on the web.
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
    email:               fields.email.trim().toLowerCase(),
    first_name:          fields.first_name.trim(),
    age:                 fields.age ?? null,
    city:                fields.city ?? null,
    occupation:          fields.occupation ?? null,
    school:              fields.school ?? null,
    degree:              fields.degree ?? null,
    bio:                 fields.bio ?? null,
    link:                fields.link ?? null,
    why:                 fields.why ?? null,
    communities:         Array.isArray(fields.communities) ? fields.communities : [],
    profession:          fields.profession ?? null,
    company:             fields.company ?? null,
    linkedin_url:        fields.linkedin_url ?? null,
    years_experience:    fields.years_experience ?? null,
    face_photo_path:     fields.face_photo_path ?? null,
    passport_photo_path: fields.passport_photo_path ?? null,
  };

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
