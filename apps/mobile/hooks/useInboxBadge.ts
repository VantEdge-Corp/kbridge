import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';

/**
 * Pending introduction requests plus unread messages, for the Inbox tab
 * badge. Reloads on foreground and on realtime changes to either source.
 */
export function useInboxBadge(): number {
  const { userId } = useMember();
  const [count, setCount] = useState(0);
  const [matchIds, setMatchIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const [incoming, connections] = await Promise.all([api.introductions.listIncoming(userId), api.connections.list(userId)]);
      setCount(incoming.length + connections.reduce((n, c) => n + c.unreadCount, 0));
      const ids = connections.map((c) => c.matchId);
      setMatchIds((prev) => (prev.length === ids.length && prev.every((id, i) => id === ids[i]) ? prev : ids));
    } catch {
      // The Inbox screen reports its own errors; a stale badge is acceptable.
    }
  }, [userId]);

  useEffect(() => {
    void load();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    const unsubscribe = api.introductions.subscribeIncoming(userId, () => void load());
    return () => {
      appState.remove();
      unsubscribe();
    };
  }, [userId, load]);

  useEffect(() => api.connections.subscribeInbox(matchIds, () => void load()), [matchIds, load]);

  return count;
}
