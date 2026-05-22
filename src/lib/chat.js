// ─────────────────────────────────────────────────────────────────────────────
// chat.js — Reads, writes, and realtime subscriptions for matches/messages.
//
// A "match" row in the DB is what the UI calls a "correspondence" — the
// thread of messages between two members who have accepted each other's
// introduction request.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase.js";

const PROFILE_COLS = "id, first_name, age, city, occupation, school, degree, bio, member_number, identity_verified, education_verified";

export async function listCorrespondences(userId) {
  const { data: matchRows, error: matchErr } = await supabase
    .from("matches")
    .select(`
      id, created_at, user_a, user_b,
      a:profiles!matches_user_a_fkey(${PROFILE_COLS}),
      b:profiles!matches_user_b_fkey(${PROFILE_COLS})
    `)
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (matchErr) throw matchErr;
  if (!matchRows?.length) return [];

  const matchIds = matchRows.map(m => m.id);

  const { data: msgs, error: msgErr } = await supabase
    .from("messages")
    .select("match_id, body, sender_id, created_at, read_at")
    .in("match_id", matchIds)
    .order("created_at", { ascending: false });

  if (msgErr) throw msgErr;

  const lastByMatch = new Map();
  const unreadByMatch = new Map();
  for (const m of msgs || []) {
    if (!lastByMatch.has(m.match_id)) lastByMatch.set(m.match_id, m);
    if (m.sender_id !== userId && !m.read_at) {
      unreadByMatch.set(m.match_id, (unreadByMatch.get(m.match_id) || 0) + 1);
    }
  }

  return matchRows.map(row => {
    const other = row.user_a === userId ? row.b : row.a;
    const last = lastByMatch.get(row.id) || null;
    return {
      matchId: row.id,
      other,
      lastMessage: last ? { body: last.body, sender_id: last.sender_id, created_at: last.created_at } : null,
      unread: unreadByMatch.get(row.id) || 0,
      createdAt: row.created_at,
    };
  });
}

export async function getCorrespondence(matchId, userId) {
  const { data: row, error: matchErr } = await supabase
    .from("matches")
    .select(`
      id, created_at, user_a, user_b,
      a:profiles!matches_user_a_fkey(${PROFILE_COLS}),
      b:profiles!matches_user_b_fkey(${PROFILE_COLS})
    `)
    .eq("id", matchId)
    .single();

  if (matchErr) throw matchErr;
  if (!row) return null;

  const other = row.user_a === userId ? row.b : row.a;

  const { data: messages, error: msgErr } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at, read_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (msgErr) throw msgErr;

  const { data: intro } = await supabase
    .from("introduction_requests")
    .select("id, note, requester_id, recipient_id, created_at")
    .eq("match_id", matchId)
    .maybeSingle();

  return {
    matchId: row.id,
    other,
    messages: messages || [],
    intro: intro || null,
    createdAt: row.created_at,
  };
}

export async function sendMessage(matchId, senderId, body) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message is empty.");
  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: senderId, body: trimmed })
    .select("id, body, sender_id, created_at, read_at")
    .single();
  if (error) throw error;
  return data;
}

export async function markCorrespondenceRead(matchId, userId) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("match_id", matchId)
    .neq("sender_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

let __chatChannelCounter = 0;
const uniqueTag = () => `${Date.now().toString(36)}-${++__chatChannelCounter}`;

export function subscribeToCorrespondence(matchId, onInsert) {
  const channel = supabase
    .channel(`correspondence:${matchId}:${uniqueTag()}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
      payload => onInsert(payload.new),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export function subscribeToInbox(matchIds, onChange) {
  if (!matchIds.length) return () => {};
  const filter = `match_id=in.(${matchIds.join(",")})`;
  const channel = supabase
    .channel(`inbox:${uniqueTag()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter },
      () => onChange(),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
