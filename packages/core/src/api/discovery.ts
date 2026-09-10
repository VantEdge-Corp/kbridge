import type { Client } from './client';
import { unwrap } from './client';
import { toSignals } from './mappers';
import type { CandidateSignalRow } from './rows';
import type { ProfilesApi } from './profiles';
import type { Candidate, Viewer } from '../matching/types';
import { LIMITS } from '../constants/limits';
import { DEFAULT_MAX_DISTANCE_MILES } from '../constants/areas';

export function createDiscoveryApi(client: Client, profiles: ProfilesApi) {
  /**
   * The viewer as the ranking functions see them: their own public profile,
   * their preferences, and their hard distance boundary.
   */
  async function getViewer(userId: string, email: string): Promise<Viewer | null> {
    const [own, prefs, priv] = await Promise.all([
      profiles.getOwn(userId),
      profiles.getPreferences(userId),
      profiles.getPrivate(userId, email),
    ]);
    if (!own) return null;
    const { verification: _v, isAdmin: _a, createdAt: _c, lastActiveAt: _l, suspended: _s, photoPaths: _p, termsVersion: _t, privacyVersion: _pv, ...profile } = own;
    return { profile, preferences: prefs, maxDistanceMiles: priv.maxDistanceMiles || DEFAULT_MAX_DISTANCE_MILES };
  }

  /**
   * Candidate pool: ids + coarse signals from the server, joined to public
   * profiles. Eligibility and ranking happen on the client with the
   * deterministic functions in matching/.
   */
  async function fetchCandidates(limit: number = LIMITS.discoveryPoolSize): Promise<Candidate[]> {
    const rows = unwrap(await client.rpc('get_discovery_candidates', { p_limit: limit })) as CandidateSignalRow[];
    if (!rows || rows.length === 0) return [];
    const byId = await profiles.getMap(rows.map((r) => r.profile_id));
    const out: Candidate[] = [];
    for (const row of rows) {
      const profile = byId.get(row.profile_id);
      if (!profile) continue;
      out.push({ profile, signals: toSignals(row) });
    }
    return out;
  }

  /** Exposure balancing input. Call with the ids actually rendered. */
  async function recordImpressions(ids: readonly string[]): Promise<void> {
    const unique = Array.from(new Set(ids)).slice(0, 100);
    if (unique.length === 0) return;
    await client.rpc('record_impressions', { p_ids: unique });
  }

  /** Marks the signed-in member active. Rate limited server-side. */
  async function touchActivity(): Promise<void> {
    await client.rpc('touch_last_active');
  }

  return { getViewer, fetchCandidates, recordImpressions, touchActivity };
}

export type DiscoveryApi = ReturnType<typeof createDiscoveryApi>;
