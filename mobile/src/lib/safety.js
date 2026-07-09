// ─────────────────────────────────────────────────────────────────────────────
// safety.js — Blocks, reports, and account deletion (migration 011).
// App Store safety requirements for a dating/UGC app.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase.js';

export const REPORT_REASONS = [
  'Fake or stolen photos',
  'Harassment or abuse',
  'Inappropriate content',
  'Spam or a scam',
  'Someone underage',
  'Other',
];

export async function blockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && error.code !== '23505') throw new Error(error.message || 'Could not block.');
}

export async function getBlockedIds(userId) {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  if (error) return [];
  return (data || []).map(r => r.blocked_id);
}

export async function reportUser(reporterId, reportedId, reason, { detail, matchId } = {}) {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason,
    detail: detail || null,
    match_id: matchId || null,
  });
  if (error) throw new Error(error.message || 'Could not submit report.');
}

// Deletes the auth user (cascades to all their data via the DB). Best-effort
// removal of profile photos first, since storage isn't covered by the cascade.
export async function deleteMyAccount(photoPaths = []) {
  if (photoPaths.length) {
    await supabase.storage.from('profile-photos').remove(photoPaths).catch(() => {});
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new Error(error.message || 'Could not delete account.');
}
