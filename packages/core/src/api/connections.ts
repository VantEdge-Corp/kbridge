import type { Client } from './client';
import { ApiError, uniqueChannelName, unwrap, unwrapMaybe } from './client';
import { toMessage } from './mappers';
import type { IntroductionRow, MatchRow, MessageRow } from './rows';
import type { ProfilesApi } from './profiles';
import type { Connection, Message } from '../types/social';

const MESSAGE_COLUMNS = 'id, match_id, sender_id, body, created_at, read_at';

export function createConnectionsApi(client: Client, profiles: ProfilesApi) {
  async function matchesFor(viewerId: string): Promise<MatchRow[]> {
    return unwrap(
      await client
        .from('matches')
        .select('id, user_a, user_b, created_at')
        .or(`user_a.eq.${viewerId},user_b.eq.${viewerId}`)
        .order('created_at', { ascending: false }),
    ) as MatchRow[];
  }

  async function introsFor(matchIds: string[]): Promise<Map<string, IntroductionRow>> {
    if (matchIds.length === 0) return new Map();
    const rows = unwrap(
      await client
        .from('introduction_requests')
        .select('id, requester_id, recipient_id, note, status, match_id, created_at, responded_at, post_id')
        .in('match_id', matchIds),
    ) as IntroductionRow[];
    const map = new Map<string, IntroductionRow>();
    for (const r of rows) if (r.match_id) map.set(r.match_id, r);
    return map;
  }

  /** Every accepted introduction, newest activity first, with last message and unread count. */
  async function list(viewerId: string): Promise<Connection[]> {
    const matches = await matchesFor(viewerId);
    if (matches.length === 0) return [];
    const matchIds = matches.map((m) => m.id);
    const [byId, intros, messages] = await Promise.all([
      profiles.getMap(matches.map((m) => (m.user_a === viewerId ? m.user_b : m.user_a))),
      introsFor(matchIds),
      client
        .from('messages')
        .select(MESSAGE_COLUMNS)
        .in('match_id', matchIds)
        .order('created_at', { ascending: false })
        .then((r) => unwrap(r) as MessageRow[]),
    ]);

    const last = new Map<string, MessageRow>();
    const unread = new Map<string, number>();
    for (const m of messages) {
      if (!last.has(m.match_id)) last.set(m.match_id, m);
      if (m.sender_id !== viewerId && !m.read_at) unread.set(m.match_id, (unread.get(m.match_id) ?? 0) + 1);
    }

    const out: Connection[] = [];
    for (const m of matches) {
      const otherId = m.user_a === viewerId ? m.user_b : m.user_a;
      const counterpart = byId.get(otherId);
      if (!counterpart) continue;
      const intro = intros.get(m.id) ?? null;
      const lastRow = last.get(m.id);
      out.push({
        matchId: m.id,
        counterpart,
        createdAt: m.created_at,
        lastMessage: lastRow ? toMessage(lastRow) : null,
        unreadCount: unread.get(m.id) ?? 0,
        introductionNote: intro?.note ?? null,
        introducedBy: intro ? (intro.requester_id === viewerId ? 'viewer' : 'counterpart') : null,
      });
    }
    out.sort((a, b) => {
      const ta = Date.parse(a.lastMessage?.createdAt ?? a.createdAt);
      const tb = Date.parse(b.lastMessage?.createdAt ?? b.createdAt);
      return tb - ta;
    });
    return out;
  }

  async function get(matchId: string, viewerId: string): Promise<{ connection: Connection; messages: Message[] } | null> {
    const match = unwrapMaybe(
      await client.from('matches').select('id, user_a, user_b, created_at').eq('id', matchId).maybeSingle(),
    ) as MatchRow | null;
    if (!match) return null;
    const otherId = match.user_a === viewerId ? match.user_b : match.user_a;
    const [counterpart, intros, rows] = await Promise.all([
      profiles.get(otherId),
      introsFor([matchId]),
      client
        .from('messages')
        .select(MESSAGE_COLUMNS)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
        .then((r) => unwrap(r) as MessageRow[]),
    ]);
    if (!counterpart) return null;
    const intro = intros.get(matchId) ?? null;
    const messages = rows.map(toMessage);
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] ?? null : null;
    return {
      connection: {
        matchId,
        counterpart,
        createdAt: match.created_at,
        lastMessage,
        unreadCount: messages.filter((m) => m.senderId !== viewerId && !m.readAt).length,
        introductionNote: intro?.note ?? null,
        introducedBy: intro ? (intro.requester_id === viewerId ? 'viewer' : 'counterpart') : null,
      },
      messages,
    };
  }

  async function send(matchId: string, senderId: string, body: string): Promise<Message> {
    const text = body.trim();
    if (!text) throw new ApiError('Write a message first.');
    if (text.length > 2000) throw new ApiError('Keep messages under 2000 characters.');
    const row = unwrap(
      await client.from('messages').insert({ match_id: matchId, sender_id: senderId, body: text }).select(MESSAGE_COLUMNS).single(),
    ) as MessageRow;
    return toMessage(row);
  }

  async function markRead(matchId: string, viewerId: string): Promise<void> {
    await client
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .neq('sender_id', viewerId)
      .is('read_at', null);
  }

  function subscribeConversation(matchId: string, onMessage: (message: Message) => void): () => void {
    const channel = client
      .channel(uniqueChannelName(`conversation:${matchId}`))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => onMessage(toMessage(payload.new as MessageRow)),
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }

  /** Any message activity across the viewer's connections. */
  function subscribeInbox(matchIds: readonly string[], onChange: () => void): () => void {
    if (matchIds.length === 0) return () => {};
    const channel = client
      .channel(uniqueChannelName('inbox'))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `match_id=in.(${matchIds.join(',')})` },
        () => onChange(),
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }

  return { list, get, send, markRead, subscribeConversation, subscribeInbox };
}

export type ConnectionsApi = ReturnType<typeof createConnectionsApi>;
