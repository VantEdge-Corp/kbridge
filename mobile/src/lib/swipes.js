// ─────────────────────────────────────────────────────────────────────────────
// swipes.js — The Discover deck's data layer (migration 007).
//
// recordSwipe returns { id, match_id }: a non-null match_id means the like
// was mutual and the DB trigger just opened (or reused) a match. The first
// swiper of a pair finds out via realtime instead — the trigger stamps
// match_id onto their earlier swipe row, which subscribeToMatchStamps hears.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase.js';

export async function getSwipeCandidates(limit = 20) {
  const { data, error } = await supabase.rpc('get_swipe_candidates', { max_results: limit });
  if (error) throw error;
  return data || [];
}

export async function recordSwipe(swiperId, swipeeId, direction) {
  const { data, error } = await supabase
    .from('swipes')
    .insert({ swiper_id: swiperId, swipee_id: swipeeId, direction })
    .select('id, match_id')
    .single();
  if (error) throw error;
  return data;
}

export function isDuplicateSwipe(error) {
  return error?.code === '23505';
}

let __swipeChannelCounter = 0;

export function subscribeToMatchStamps(userId, onMatch) {
  const tag = `${Date.now().toString(36)}-${++__swipeChannelCounter}`;
  const channel = supabase
    .channel(`match-stamps:${userId}:${tag}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'swipes', filter: `swiper_id=eq.${userId}` },
      payload => {
        if (payload.new?.match_id) onMatch(payload.new);
      },
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function getProfileById(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Count today's likes for the daily free-tier cap.
export async function getLikesToday(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('swipes')
    .select('id', { count: 'exact', head: true })
    .eq('swiper_id', userId)
    .eq('direction', 'like')
    .gte('created_at', start.toISOString());
  if (error) return 0;
  return count || 0;
}
