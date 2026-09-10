import type { Preferences, MultiPreference, RangePreference } from '../types/preferences';
import { MULTI_PREFERENCE_KEYS, effectiveStrength } from '../types/preferences';
import type { PublicProfile } from '../types/profile';
import type { Viewer, Candidate } from './types';

/* ------------------------------------------------------------------ */
/* Dimension access                                                    */
/* ------------------------------------------------------------------ */

type MultiKey = (typeof MULTI_PREFERENCE_KEYS)[number];

/**
 * How a candidate's public profile answers each multi-value dimension.
 * Returns `null` when the dimension does not participate for this candidate
 * (race/ethnicity with "prefer not to say", or data the member never provided).
 */
export function candidateValues(profile: PublicProfile, key: MultiKey): string[] | null {
  switch (key) {
    case 'nationalities':
      return profile.nationalities.length ? profile.nationalities : null;
    case 'raceEthnicities':
      if (profile.raceEthnicityDisclosure !== 'disclosed') return null;
      return profile.raceEthnicities.length ? profile.raceEthnicities : null;
    case 'languages':
      return profile.languages.length ? profile.languages : null;
    case 'education':
      return profile.educationDegreeLevel ? [profile.educationDegreeLevel] : null;
    case 'occupation':
      return profile.industry ? [profile.industry] : null;
    case 'studentStatus':
      return profile.studentStatus ? [profile.studentStatus] : null;
    case 'relationshipIntent':
      return profile.relationshipIntent ? [profile.relationshipIntent] : null;
    case 'drinking':
      return profile.lifestyle.drinking && profile.lifestyle.drinking !== 'prefer_not_to_say'
        ? [profile.lifestyle.drinking]
        : null;
    case 'smoking':
      return profile.lifestyle.smoking && profile.lifestyle.smoking !== 'prefer_not_to_say'
        ? [profile.lifestyle.smoking]
        : null;
    case 'children':
      return profile.lifestyle.children && profile.lifestyle.children !== 'prefer_not_to_say'
        ? [profile.lifestyle.children]
        : null;
    case 'interests':
      return profile.interests.length ? profile.interests : null;
  }
}

/** OR semantics: the candidate matches when any selected value matches. */
export function multiMatches(pref: MultiPreference, values: string[] | null): boolean {
  if (!values) return false;
  return values.some((v) => pref.values.includes(v));
}

/** 1 inside the range, a partial credit just outside it, 0 otherwise or when unknown. */
export function rangeMatch(pref: RangePreference, value: number | null, tolerance: number): number {
  if (value == null) return 0;
  if (value >= pref.min && value <= pref.max) return 1;
  const distance = value < pref.min ? pref.min - value : value - pref.max;
  return distance <= tolerance ? 0.5 : 0;
}

export const AGE_TOLERANCE_YEARS = 3;
export const HEIGHT_TOLERANCE_CM = 5;

/* ------------------------------------------------------------------ */
/* Eligibility                                                         */
/* ------------------------------------------------------------------ */

/**
 * Hard requirements only. A candidate that fails any `required` dimension of
 * the viewer's preferences is excluded. Distance is always a hard boundary.
 * Nothing here consults demand, activity, or any internal signal.
 */
export function eligible(viewer: Viewer, candidate: Candidate): boolean {
  const { profile: a, preferences: prefs } = viewer;
  const b = candidate.profile;
  if (a.id === b.id) return false;
  if (candidate.signals.distanceMiles > viewer.maxDistanceMiles) return false;

  if (effectiveStrength(prefs.ageRange) === 'required') {
    if (rangeMatch(prefs.ageRange, b.age, 0) < 1) return false;
  }
  if (effectiveStrength(prefs.height) === 'required') {
    if (rangeMatch(prefs.height, b.height, 0) < 1) return false;
  }
  for (const key of MULTI_PREFERENCE_KEYS) {
    const pref = prefs[key] as MultiPreference;
    if (effectiveStrength(pref) !== 'required') continue;
    if (!multiMatches(pref, candidateValues(b, key))) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Directional compatibility                                           */
/* ------------------------------------------------------------------ */

/**
 * compatibility(A, B): how well B's public profile satisfies A's `preferred`
 * dimensions. Directional by construction: it reads A's preferences and B's
 * profile only. `required` dimensions are handled by `eligible` and `any`
 * dimensions contribute nothing. With no preferred dimensions the result is a
 * neutral 0.5. Dimensions the candidate did not disclose are skipped entirely
 * (they count neither for nor against), so "prefer not to say" never
 * participates in matching.
 */
export function compatibility(preferences: Preferences, profile: PublicProfile): number {
  let weight = 0;
  let matched = 0;

  if (effectiveStrength(preferences.ageRange) === 'preferred' && profile.age != null) {
    weight += 1;
    matched += rangeMatch(preferences.ageRange, profile.age, AGE_TOLERANCE_YEARS);
  }
  if (effectiveStrength(preferences.height) === 'preferred' && profile.height != null) {
    weight += 1;
    matched += rangeMatch(preferences.height, profile.height, HEIGHT_TOLERANCE_CM);
  }
  for (const key of MULTI_PREFERENCE_KEYS) {
    const pref = preferences[key] as MultiPreference;
    if (effectiveStrength(pref) !== 'preferred') continue;
    const values = candidateValues(profile, key);
    if (values === null) continue;
    weight += 1;
    matched += multiMatches(pref, values) ? 1 : 0;
  }

  if (weight === 0) return 0.5;
  return round2(matched / weight);
}

/** compatibility(A, B) for a viewer and a candidate. */
export function compatibilityAB(viewer: Viewer, candidate: Candidate): number {
  return compatibility(viewer.preferences, candidate.profile);
}

/**
 * compatibility(B, A). B's preferences are private and never sent to A's
 * device, so the server computes this with the same rules and returns it as a
 * rounded signal. Kept as its own function so the two directions are always
 * calculated separately and can be swapped for a server round-trip later.
 */
export function compatibilityBA(_viewer: Viewer, candidate: Candidate): number {
  return clamp01(candidate.signals.reverseCompatibility);
}

/**
 * Reciprocal compatibility rewards balance: the harmonic mean of the two
 * directions, so a pairing where only one side is a strong fit scores lower
 * than a pairing where both sides are moderately good.
 */
export function reciprocalCompatibility(viewer: Viewer, candidate: Candidate): number {
  const ab = compatibilityAB(viewer, candidate);
  const ba = compatibilityBA(viewer, candidate);
  if (ab + ba === 0) return 0;
  return round2((2 * ab * ba) / (ab + ba));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
