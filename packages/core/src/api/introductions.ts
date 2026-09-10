import type { Client } from './client';
import { ApiError, uniqueChannelName, unwrap } from './client';
import { counterpartId, introductionStatus } from './mappers';
import type { IntroductionRow } from './rows';
import type { ProfilesApi } from './profiles';
import type { IntroductionRequest } from '../types/social';
import { LIMITS } from '../constants/limits';

export function validateIntroNote(note: string): string | null {
  const trimmed = note.trim();
  if (trimmed.length < LIMITS.introNoteMin) return `Write at least ${LIMITS.introNoteMin} characters.`;
  if (trimmed.length > LIMITS.introNoteMax) return `Keep it under ${LIMITS.introNoteMax} characters.`;
  return null;
}

const COLUMNS = 'id, requester_id, recipient_id, note, status, match_id, created_at, responded_at, post_id';

export function createIntroductionsApi(client: Client, profiles: ProfilesApi) {
  async function hydrate(rows: IntroductionRow[], viewerId: string): Promise<IntroductionRequest[]> {
    const byId = await profiles.getMap(rows.map((r) => counterpartId(r, viewerId)));
    const out: IntroductionRequest[] = [];
    for (const r of rows) {
      const counterpart = byId.get(counterpartId(r, viewerId));
      if (!counterpart) continue;
      out.push({
        id: r.id,
        requesterId: r.requester_id,
        recipientId: r.recipient_id,
        note: r.note,
        status: introductionStatus(r.status),
        matchId: r.match_id,
        createdAt: r.created_at,
        respondedAt: r.responded_at,
        counterpart,
        outgoing: r.requester_id === viewerId,
        postId: r.post_id,
      });
    }
    return out;
  }

  /** "Interested" / "Request introduction": opens a pending request with a note. */
  async function request(input: { viewerId: string; recipientId: string; note: string; postId?: string | null }): Promise<string> {
    const problem = validateIntroNote(input.note);
    if (problem) throw new ApiError(problem);
    const data = unwrap(
      await client
        .from('introduction_requests')
        .insert({
          requester_id: input.viewerId,
          recipient_id: input.recipientId,
          note: input.note.trim(),
          post_id: input.postId ?? null,
        })
        .select('id')
        .single(),
    ) as { id: string };
    return data.id;
  }

  async function listIncoming(viewerId: string): Promise<IntroductionRequest[]> {
    const rows = unwrap(
      await client
        .from('introduction_requests')
        .select(COLUMNS)
        .eq('recipient_id', viewerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ) as IntroductionRow[];
    return hydrate(rows, viewerId);
  }

  async function listOutgoing(viewerId: string): Promise<IntroductionRequest[]> {
    const rows = unwrap(
      await client
        .from('introduction_requests')
        .select(COLUMNS)
        .eq('requester_id', viewerId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ) as IntroductionRow[];
    return hydrate(rows, viewerId);
  }

  /** Ids of members the viewer has an open or accepted request with, in either direction. */
  async function activeCounterpartIds(viewerId: string): Promise<Set<string>> {
    const rows = unwrap(
      await client
        .from('introduction_requests')
        .select('requester_id, recipient_id')
        .in('status', ['pending', 'accepted'])
        .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`),
    ) as Array<{ requester_id: string; recipient_id: string }>;
    return new Set(rows.map((r) => (r.requester_id === viewerId ? r.recipient_id : r.requester_id)));
  }

  /** Accepting opens a connection (a DB trigger creates the match) and returns its id. */
  async function accept(id: string): Promise<string> {
    const data = unwrap(
      await client
        .from('introduction_requests')
        .update({ status: 'accepted' })
        .eq('id', id)
        .eq('status', 'pending')
        .select('match_id')
        .single(),
    ) as { match_id: string | null };
    if (!data.match_id) throw new ApiError('The connection could not be opened.');
    return data.match_id;
  }

  async function decline(id: string): Promise<void> {
    unwrap(await client.from('introduction_requests').update({ status: 'declined' }).eq('id', id).eq('status', 'pending').select('id'));
  }

  async function withdraw(id: string): Promise<void> {
    unwrap(await client.from('introduction_requests').update({ status: 'withdrawn' }).eq('id', id).eq('status', 'pending').select('id'));
  }

  /** Fires on any change to requests addressed to the viewer. */
  function subscribeIncoming(viewerId: string, onChange: () => void): () => void {
    const channel = client
      .channel(uniqueChannelName(`intro-requests:${viewerId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'introduction_requests', filter: `recipient_id=eq.${viewerId}` },
        () => onChange(),
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }

  return { request, listIncoming, listOutgoing, activeCounterpartIds, accept, decline, withdraw, subscribeIncoming };
}

export type IntroductionsApi = ReturnType<typeof createIntroductionsApi>;
