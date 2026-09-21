import type { Candidate, Viewer } from '@peaches/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

interface State {
  viewer: Viewer | null;
  areaId: string | null;
  candidates: Candidate[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

/** Loads the viewer and the discovery pool; ranking happens in the screen. */
export function useCandidates() {
  const { userId, email } = useMember();
  const [state, setState] = useState<State>({ viewer: null, areaId: null, candidates: [], loading: true, refreshing: false, error: null });
  const reported = useRef(new Set<string>());

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      // Until the first viewer arrives the screen is loading, whatever triggered the call; otherwise an
      // early focus-refresh would flash an empty state (no area, no people) over nothing.
      setState((s) => ({ ...s, loading: !s.viewer, refreshing: mode === 'refresh' && !!s.viewer, error: null }));
      try {
        const [viewer, candidates, priv] = await Promise.all([
          api.discovery.getViewer(userId, email),
          api.discovery.fetchCandidates(),
          api.profiles.getPrivate(userId, email),
        ]);
        setState({ viewer, areaId: priv.areaId, candidates, loading: false, refreshing: false, error: null });
      } catch (e) {
        setState((s) => ({ ...s, loading: false, refreshing: false, error: errorMessage(e) }));
      }
    },
    [userId, email],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  /** Exposure balancing: report each rendered profile once per app session. */
  const reportImpressions = useCallback((ids: readonly string[]) => {
    const fresh = ids.filter((id) => !reported.current.has(id));
    if (fresh.length === 0) return;
    for (const id of fresh) reported.current.add(id);
    void api.discovery.recordImpressions(fresh).catch(() => {});
  }, []);

  const reload = useCallback(() => load('initial'), [load]);
  const refresh = useCallback(() => load('refresh'), [load]);
  const setViewer = useCallback((viewer: Viewer) => setState((s) => ({ ...s, viewer })), []);
  const setAreaId = useCallback((areaId: string | null) => setState((s) => ({ ...s, areaId })), []);
  /** Drops a member the viewer has acted on (passed, or wrote to) until the next reload. */
  const removeCandidate = useCallback((id: string) => setState((s) => ({ ...s, candidates: s.candidates.filter((c) => c.profile.id !== id) })), []);

  return { ...state, reload, refresh, setViewer, setAreaId, reportImpressions, removeCandidate };
}
