import type { IntroductionRequest } from '@peaches/core';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';

interface InboxSummary {
  /** Pending introduction requests to the member, newest first. */
  incoming: IntroductionRequest[];
  /** Pending requests plus unread messages, for the Inbox tab badge. */
  badge: number;
  reload: () => Promise<void>;
}

const InboxSummaryContext = createContext<InboxSummary | null>(null);

/**
 * What is waiting in the Inbox, loaded once for the tab badge and the requests
 * row on Home. Reloads on foreground and on realtime changes to either source.
 */
export function InboxSummaryProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useMember();
  const [incoming, setIncoming] = useState<IntroductionRequest[]>([]);
  const [unread, setUnread] = useState(0);
  const [matchIds, setMatchIds] = useState<string[]>([]);

  const reload = useCallback(async () => {
    try {
      const [requests, connections] = await Promise.all([api.introductions.listIncoming(userId), api.connections.list(userId)]);
      setIncoming(requests);
      setUnread(connections.reduce((n, c) => n + c.unreadCount, 0));
      const ids = connections.map((c) => c.matchId);
      setMatchIds((prev) => (prev.length === ids.length && prev.every((id, i) => id === ids[i]) ? prev : ids));
    } catch {
      // The Inbox screen reports its own errors; a stale summary is acceptable.
    }
  }, [userId]);

  useEffect(() => {
    void reload();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reload();
    });
    const unsubscribe = api.introductions.subscribeIncoming(userId, () => void reload());
    return () => {
      appState.remove();
      unsubscribe();
    };
  }, [userId, reload]);

  useEffect(() => api.connections.subscribeInbox(matchIds, () => void reload()), [matchIds, reload]);

  const value = useMemo(() => ({ incoming, badge: incoming.length + unread, reload }), [incoming, unread, reload]);
  return <InboxSummaryContext.Provider value={value}>{children}</InboxSummaryContext.Provider>;
}

export function useInboxSummary(): InboxSummary {
  const value = useContext(InboxSummaryContext);
  if (!value) throw new Error('useInboxSummary must be used inside InboxSummaryProvider');
  return value;
}
