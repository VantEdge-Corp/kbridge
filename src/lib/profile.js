// ─────────────────────────────────────────────────────────────────────────────
// profile.js — Normalize a DB profile row into the shape the UI expects.
//
// The DB stores first_name, member_number, etc.; the UI was originally
// built against a denormalized shape (name, memberNumber, gradient,
// initials). This helper bridges the two without forcing every component
// to know the DB column names.
// ─────────────────────────────────────────────────────────────────────────────

const GRADIENTS = [
  "portrait-gradient-1",
  "portrait-gradient-2",
  "portrait-gradient-3",
  "portrait-gradient-4",
  "portrait-gradient-5",
  "portrait-gradient-6",
  "portrait-gradient-7",
  "portrait-gradient-8",
];

function hashStringToIndex(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % mod;
}

export function displayProfile(row) {
  if (!row) return null;
  const name = row.first_name || "Member";
  const initials = (row.first_name || "?").trim().charAt(0).toUpperCase();
  const gradient = GRADIENTS[hashStringToIndex(row.id || name, GRADIENTS.length)];
  const education =
    row.degree && row.school ? `${row.degree}, ${row.school}`
    : row.degree || row.school || "";
  return {
    id: row.id,
    name,
    age: row.age,
    city: row.city || "",
    occupation: row.occupation || "",
    education,
    bio: row.bio || "",
    communities: row.communities || [],
    memberNumber: row.member_number || "№ ——",
    initials,
    gradient,
    identityVerified: !!row.identity_verified,
    educationVerified: !!row.education_verified,
  };
}
