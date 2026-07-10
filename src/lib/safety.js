// ─────────────────────────────────────────────────────────────────────────────
// safety.js — Blocks, reports, and account deletion (migration 011), web
// edition. Mirrors mobile/src/lib/safety.js.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase.js";

export const REPORT_REASONS = [
  "Fake or stolen photos",
  "Harassment or abuse",
  "Inappropriate content",
  "Spam or a scam",
  "Someone underage",
  "Other",
];

export async function blockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && error.code !== "23505") throw new Error(error.message || "Could not block.");
}

export async function getBlockedIds(userId) {
  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);
  if (error) return [];
  return (data || []).map(r => r.blocked_id);
}

export async function reportUser(reporterId, reportedId, reason, { detail, matchId } = {}) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason,
    detail: detail || null,
    match_id: matchId || null,
  });
  if (error) throw new Error(error.message || "Could not submit report.");
}

export async function deleteMyAccount(photoPaths = []) {
  if (photoPaths.length) {
    await supabase.storage.from("profile-photos").remove(photoPaths).catch(() => {});
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw new Error(error.message || "Could not delete account.");
}

// ── Admin: reports queue ──────────────────────────────────
export async function listReports(status) {
  let q = supabase
    .from("reports")
    .select(`
      id, reason, detail, status, created_at, match_id, reporter_id, reported_id,
      reporter:profiles!reports_reporter_id_fkey(first_name, member_number),
      reported:profiles!reports_reported_id_fkey(id, first_name, member_number)
    `)
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message || "Could not load reports.");
  return data || [];
}

export async function updateReportStatus(id, status) {
  const { data, error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message || "Could not update report.");
  return data;
}
