// ─────────────────────────────────────────────────────────────────────────────
// profile.js — Normalize a DB profile row into the shape the UI expects.
// Same hash → gradient mapping as the web app (src/lib/profile.js), so a
// member's portrait looks identical on both platforms.
// ─────────────────────────────────────────────────────────────────────────────

import { GRADIENTS } from '../theme.js';
import { publicUrl } from './photos.js';

function hashStringToIndex(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % mod;
}

export function displayProfile(row) {
  if (!row) return null;
  const name = row.first_name || 'Member';
  const initials = (row.first_name || '?').trim().charAt(0).toUpperCase();
  const gradient = GRADIENTS[hashStringToIndex(row.id || name, GRADIENTS.length)];
  const education =
    row.degree && row.school ? `${row.degree}, ${row.school}`
    : row.degree || row.school || '';
  const photoPaths = Array.isArray(row.photo_paths) ? row.photo_paths : [];
  const photos = photoPaths.map(publicUrl).filter(Boolean);
  return {
    id: row.id,
    name,
    age: row.age,
    city: row.city || '',
    occupation: row.occupation || '',
    education,
    bio: row.bio || '',
    communities: row.communities || [],
    memberNumber: row.member_number || '№ ——',
    tier: row.tier || 'observer',
    photoPaths,
    photos,
    photoUrl: photos[0] || null,
    photoVerified: !!row.photo_verified,
    initials,
    gradient,
    identityVerified: !!row.identity_verified,
    educationVerified: !!row.education_verified,
  };
}
