// ─────────────────────────────────────────────────────────────────────────────
// db.js — Stub data layer
//
// Replace these functions with real Supabase (or any other backend) calls.
// Install: npm install @supabase/supabase-js
// Docs:    https://supabase.com/docs/reference/javascript
//
// Example swap-in for signIn:
//
//   import { createClient } from '@supabase/supabase-js'
//   const supabase = createClient(
//     import.meta.env.VITE_SUPABASE_URL,
//     import.meta.env.VITE_SUPABASE_ANON_KEY
//   )
//
//   export async function signIn(email, password) {
//     const { data, error } = await supabase.auth.signInWithPassword({ email, password })
//     if (error) throw error
//     return { user: data.user, session: data.session }
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────

/** Sign up a new user with email + password */
export async function signUp(email, password) {
  // TODO: replace with supabase.auth.signUp({ email, password })
  return { user: { id: "mock-user-id", email }, session: { access_token: "mock-token" } };
}

/** Sign in an existing user */
export async function signIn(email, password) {
  // TODO: replace with supabase.auth.signInWithPassword({ email, password })
  return { user: { id: "mock-user-id", email }, session: { access_token: "mock-token" } };
}

/** Sign out the current user */
export async function signOut() {
  // TODO: replace with supabase.auth.signOut()
}

/** Get the current session on page load */
export async function getSession() {
  // TODO: replace with supabase.auth.getSession()
  return null;
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthStateChange(callback) {
  // TODO: replace with supabase.auth.onAuthStateChange(callback)
  // callback receives (event, session)
  return () => {}; // unsubscribe no-op
}

// ── Profiles ──────────────────────────────────────────────────────────────────

/** Load a user's profile by their auth user ID */
export async function getProfile(userId) {
  // TODO: replace with:
  // const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  // return data
  return null;
}

/** Save / update a user's profile */
export async function saveProfile(userId, updates) {
  // TODO: replace with:
  // const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  // if (error) throw error
  console.log("saveProfile stub — would write:", updates);
}

// ── Invitations ───────────────────────────────────────────────────────────────

/** Check if an invitation code is valid and unused */
export async function checkInviteCode(code) {
  // TODO: replace with:
  // const { data } = await supabase
  //   .from('invitations')
  //   .select('id,used_by,expires_at')
  //   .eq('code', code.toUpperCase())
  //   .single()
  // return !!(data && !data.used_by && new Date(data.expires_at) > new Date())
  return false;
}

/** Generate a new invite code (Founding members only) */
export async function createInviteCode(userId) {
  // TODO: replace with:
  // const code = `LIN-FOUNDING-${Math.random().toString(36).slice(2,8).toUpperCase()}`
  // const { data } = await supabase.from('invitations').insert({ code, created_by: userId }).select().single()
  // return data
  return null;
}

/** Load all invite codes created by a user */
export async function getInvites(userId) {
  // TODO: replace with:
  // const { data } = await supabase
  //   .from('invitations')
  //   .select('*')
  //   .eq('created_by', userId)
  //   .order('created_at', { ascending: false })
  // return data || []
  return [];
}

// ── Tier ──────────────────────────────────────────────────────────────────────

/** Upgrade a user's tier. In production, trigger a Stripe checkout instead. */
export async function upgradeTier(userId, newTier) {
  // TODO: replace with Stripe checkout session creation, then webhook to update DB.
  // For quick prototyping only:
  // await supabase.from('profiles').update({ tier: newTier }).eq('id', userId)
  console.log("upgradeTier stub — would set tier:", newTier, "for user:", userId);
}
