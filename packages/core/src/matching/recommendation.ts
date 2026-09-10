import type { Viewer, Candidate, RankedCandidate } from './types';
import { compatibilityAB, eligible, reciprocalCompatibility, round2 } from './compatibility';
import {
  activitySignal,
  demandSignal,
  distanceSignal,
  exposureAdjustment,
  isNewMember,
  isRecentlyActive,
  newUserExploration,
} from './signals';

/**
 * Weights are explicit so the balance is auditable. Compatibility and
 * reciprocal potential together carry 60% of the score; internal demand is a
 * small, diminishing input. Exploration and exposure are additive nudges.
 */
export const WEIGHTS = {
  compatibility: 0.3,
  reciprocal: 0.3,
  distance: 0.12,
  activity: 0.13,
  demand: 0.05,
} as const;

export function recommendationScore(viewer: Viewer, candidate: Candidate, now: number = Date.now()): number {
  const base =
    WEIGHTS.compatibility * compatibilityAB(viewer, candidate) +
    WEIGHTS.reciprocal * reciprocalCompatibility(viewer, candidate) +
    WEIGHTS.distance * distanceSignal(viewer, candidate) +
    WEIGHTS.activity * activitySignal(candidate, now) +
    WEIGHTS.demand * demandSignal(candidate);
  return round2(base + newUserExploration(candidate, now) + exposureAdjustment(candidate));
}

/** Deterministic tie-break so equal scores always order the same way. */
function byIdAsc(a: Candidate, b: Candidate): number {
  return a.profile.id < b.profile.id ? -1 : a.profile.id > b.profile.id ? 1 : 0;
}

export function eligibleCandidates(viewer: Viewer, candidates: readonly Candidate[]): Candidate[] {
  return candidates.filter((c) => eligible(viewer, c));
}

/** FOR YOU: personalised ranking. */
export function rankForYou(viewer: Viewer, candidates: readonly Candidate[], now: number = Date.now()): RankedCandidate[] {
  return eligibleCandidates(viewer, candidates)
    .map((c) => ({ ...c, score: recommendationScore(viewer, c, now) }))
    .sort((a, b) => b.score - a.score || byIdAsc(a, b));
}

/** NEARBY: proximity first, then fit. */
export function rankNearby(viewer: Viewer, candidates: readonly Candidate[], now: number = Date.now()): RankedCandidate[] {
  return eligibleCandidates(viewer, candidates)
    .map((c) => ({ ...c, score: recommendationScore(viewer, c, now) }))
    .sort((a, b) => a.signals.distanceMiles - b.signals.distanceMiles || b.score - a.score || byIdAsc(a, b));
}

/** NEW: recently approved members, newest first. */
export function rankNew(viewer: Viewer, candidates: readonly Candidate[], now: number = Date.now()): RankedCandidate[] {
  return eligibleCandidates(viewer, candidates)
    .filter((c) => isNewMember(c, now))
    .map((c) => ({ ...c, score: recommendationScore(viewer, c, now) }))
    .sort((a, b) => Date.parse(b.signals.createdAt) - Date.parse(a.signals.createdAt) || byIdAsc(a, b));
}

/** ACTIVE: recently active members, most recent first. */
export function rankActive(viewer: Viewer, candidates: readonly Candidate[], now: number = Date.now()): RankedCandidate[] {
  return eligibleCandidates(viewer, candidates)
    .filter((c) => isRecentlyActive(c, now))
    .map((c) => ({ ...c, score: recommendationScore(viewer, c, now) }))
    .sort(
      (a, b) =>
        Date.parse(b.signals.lastActiveAt) - Date.parse(a.signals.lastActiveAt) || b.score - a.score || byIdAsc(a, b),
    );
}

export type HomeSection = 'for_you' | 'nearby' | 'new' | 'active';

export const HOME_SECTIONS: ReadonlyArray<{ key: HomeSection; label: string }> = [
  { key: 'for_you', label: 'For You' },
  { key: 'nearby', label: 'Nearby' },
  { key: 'new', label: 'New' },
  { key: 'active', label: 'Active' },
];

export function rankSection(
  section: HomeSection,
  viewer: Viewer,
  candidates: readonly Candidate[],
  now: number = Date.now(),
): RankedCandidate[] {
  switch (section) {
    case 'for_you':
      return rankForYou(viewer, candidates, now);
    case 'nearby':
      return rankNearby(viewer, candidates, now);
    case 'new':
      return rankNew(viewer, candidates, now);
    case 'active':
      return rankActive(viewer, candidates, now);
  }
}
