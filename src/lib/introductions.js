// ─────────────────────────────────────────────────────────────────────────────
// introductions.js — Reads & writes for introduction_requests.
//
// An "introduction request" is the deliberate first step before a
// correspondence opens. Requester writes a 20–500 character note;
// recipient reads and accepts or declines. On accept, a match row
// is created by the database trigger.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase.js";

const NOTE_MIN = 20;
const NOTE_MAX = 500;

const PROFILE_COLS = "id, first_name, age, city, occupation, school, degree, bio, communities, member_number, identity_verified, education_verified";

export const INTRO_NOTE_LIMITS = { min: NOTE_MIN, max: NOTE_MAX };

export function validateIntroNote(note) {
  const len = (note || "").trim().length;
  if (len < NOTE_MIN) return { ok: false, reason: `At least ${NOTE_MIN} characters.` };
  if (len > NOTE_MAX) return { ok: false, reason: `At most ${NOTE_MAX} characters.` };
  return { ok: true };
}

export async function createIntroductionRequest(requesterId, recipientId, note) {
  const valid = validateIntroNote(note);
  if (!valid.ok) throw new Error(valid.reason);
  const { data, error } = await supabase
    .from("introduction_requests")
    .insert({
      requester_id: requesterId,
      recipient_id: recipientId,
      note: note.trim(),
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listIncomingRequests(userId) {
  const { data, error } = await supabase
    .from("introduction_requests")
    .select(`
      id, note, status, created_at, responded_at, match_id, requester_id, recipient_id,
      requester:profiles!introduction_requests_requester_id_fkey(${PROFILE_COLS})
    `)
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listOutgoingRequests(userId) {
  const { data, error } = await supabase
    .from("introduction_requests")
    .select(`
      id, note, status, created_at, responded_at, match_id, requester_id, recipient_id,
      recipient:profiles!introduction_requests_recipient_id_fkey(${PROFILE_COLS})
    `)
    .eq("requester_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function acceptIntroductionRequest(requestId) {
  const { data, error } = await supabase
    .from("introduction_requests")
    .update({ status: "accepted" })
    .eq("id", requestId)
    .select("id, match_id, status")
    .single();
  if (error) throw error;
  return data;
}

export async function declineIntroductionRequest(requestId) {
  const { error } = await supabase
    .from("introduction_requests")
    .update({ status: "declined" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function withdrawIntroductionRequest(requestId) {
  const { error } = await supabase
    .from("introduction_requests")
    .update({ status: "withdrawn" })
    .eq("id", requestId);
  if (error) throw error;
}

let __introChannelCounter = 0;

export function subscribeToIncomingRequests(userId, onChange) {
  const tag = `${Date.now().toString(36)}-${++__introChannelCounter}`;
  const channel = supabase
    .channel(`incoming-intros:${userId}:${tag}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "introduction_requests", filter: `recipient_id=eq.${userId}` },
      () => onChange(),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
