// ─────────────────────────────────────────────────────────────────────────────
// applications.js — Repository for the public application + admin queue.
//
// The applications table lives outside auth.users on purpose: anyone can
// submit an application without an account, and the auth.users row only
// gets created on the first magic-link login *after* the application is
// approved (see migrations/002_applications_gate.sql → handle_new_user).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase.js";

const TABLE = "applications";

// Statuses surfaced by the public RPCs. 'rejected' is collapsed to
// 'pending' on the way out (silent-decline policy).
export const PUBLIC_STATUS = Object.freeze({
  PENDING:    "pending",
  APPROVED:   "approved",
  WAITLISTED: "waitlisted",
  CLAIMED:    "claimed",
});

// Internal statuses the committee sees in the admin panel.
export const ADMIN_STATUS = Object.freeze({
  PENDING:    "pending",
  APPROVED:   "approved",
  WAITLISTED: "waitlisted",
  REJECTED:   "rejected",
  CLAIMED:    "claimed",
});

/**
 * Submit a new application. Public — usable by anon users.
 * Returns { status_token, email } on success; throws on failure.
 *
 * @param {{
 *   email: string, first_name: string, age?: number|null, city?: string,
 *   occupation?: string, school?: string, degree?: string, bio?: string,
 *   link?: string, why?: string, communities?: string[],
 *   profession?: string, company?: string, linkedin_url?: string,
 *   years_experience?: number|null,
 *   face_photo_path?: string, passport_photo_path?: string
 * }} fields
 */
export async function submitApplication(fields) {
  if (!fields?.email) throw new Error("Email is required.");
  if (!fields?.first_name) throw new Error("First name is required.");

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

  // Auxiliary results (face match score, etc.) ride along in payload
  // so we don't add a new column for each verification provider.
  const payload = {};
  if (fields.face_match) payload.face_match = fields.face_match;
  if (Object.keys(payload).length) row.payload = payload;

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select("status_token, email")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("An application from this email is already on file.");
    }
    throw new Error(error.message || "Could not submit application.");
  }

  return data;
}

/**
 * Public status lookup by token. Goes through the RPC so the
 * silent-decline collapse applies. Returns null if token unknown.
 */
export async function getApplicationStatusByToken(token) {
  if (!token) return null;
  const { data, error } = await supabase
    .rpc("get_application_status", { p_token: token });
  if (error) throw new Error(error.message || "Could not load status.");
  return Array.isArray(data) && data.length ? data[0] : null;
}

/**
 * Public lookup used by /signup/:token. Returns { email, first_name, status }
 * for approved applications only. Returns null for any other status —
 * unapproved tokens cannot leak the applicant's email through this RPC.
 */
export async function getApplicationForSignup(token) {
  if (!token) return null;
  const { data, error } = await supabase
    .rpc("get_application_for_signup", { p_token: token });
  if (error) throw new Error(error.message || "Could not load application.");
  return Array.isArray(data) && data.length ? data[0] : null;
}

/**
 * Pre-check used by the login page. Returns a PUBLIC_STATUS value
 * or null if no application exists for the email.
 */
export async function getApplicationEmailStatus(email) {
  if (!email) return null;
  const { data, error } = await supabase
    .rpc("get_application_email_status", { p_email: email.trim().toLowerCase() });
  if (error) throw new Error(error.message || "Could not check status.");
  return data ?? null;
}

// ── Admin-only operations (RLS-gated by is_admin on profiles) ────────────────

/**
 * List applications, filtered by status. Admin RLS gates this server-side.
 */
export async function listApplications({ status, search } = {}) {
  let q = supabase.from(TABLE).select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw new Error(error.message || "Could not load applications.");

  const rows = data || [];
  if (!search) return rows;

  const needle = search.toLowerCase();
  return rows.filter(r =>
    r.first_name?.toLowerCase().includes(needle) ||
    r.email?.toLowerCase().includes(needle) ||
    r.city?.toLowerCase().includes(needle) ||
    r.occupation?.toLowerCase().includes(needle) ||
    (r.communities ?? []).join(" ").toLowerCase().includes(needle)
  );
}

/**
 * Record a committee decision. The decided_by user must be is_admin.
 *
 * @param {string} id
 * @param {"approved"|"rejected"|"waitlisted"|"pending"} status
 * @param {{ note?: string, decidedBy?: string }} opts
 */
export async function decideApplication(id, status, { note, decidedBy } = {}) {
  const updates = {
    status,
    decided_at: status === "pending" ? null : new Date().toISOString(),
    decided_by: status === "pending" ? null : (decidedBy ?? null),
  };
  if (note !== undefined) updates.internal_note = note;

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message || "Could not save decision.");
  return data;
}

/**
 * Save an internal-only reviewer note without changing status.
 */
export async function saveInternalNote(id, note) {
  const { error } = await supabase
    .from(TABLE)
    .update({ internal_note: note ?? null })
    .eq("id", id);
  if (error) throw new Error(error.message || "Could not save note.");
}
