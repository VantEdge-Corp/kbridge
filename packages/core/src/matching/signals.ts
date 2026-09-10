import { LIMITS } from '../constants/limits';
import type { Viewer, Candidate } from './types';
import { clamp01, round2 } from './compatibility';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Inside the viewer's radius (a hard boundary enforced by `eligible`), closer
 * candidates receive a modest soft advantage: 1.0 at zero distance falling
 * linearly to 0.5 at the edge of the radius.
 */
export function distanceSignal(viewer: Viewer, candidate: Candidate): number {
  const radius = Math.max(1, viewer.maxDistanceMiles);
  const d = Math.max(0, candidate.signals.distanceMiles);
  if (d >= radius) return 0.5;
  return round2(1 - 0.5 * (d / radius));
}

/** Demand bucket at which the signal saturates. */
export const DEMAND_SATURATION = 20;

/**
 * Internal demand / engagement signal with diminishing returns: logarithmic in
 * the bucketed count of introduction requests received, saturating at
 * DEMAND_SATURATION. It is never shown to members. Nationality and
 * race/ethnicity are not inputs here and must never become inputs.
 */
export function demandSignal(candidate: Candidate): number {
  const bucket = Math.max(0, candidate.signals.demandBucket);
  return round2(clamp01(Math.log1p(bucket) / Math.log1p(DEMAND_SATURATION)));
}

/** Recency of activity, stepped by day so the truncated timestamp is enough. */
export function activitySignal(candidate: Candidate, now: number = Date.now()): number {
  const last = Date.parse(candidate.signals.lastActiveAt);
  if (Number.isNaN(last)) return 0.1;
  const days = Math.max(0, (now - last) / DAY_MS);
  if (days < 1) return 1;
  if (days < 3) return 0.8;
  if (days < LIMITS.activeWithinDays) return 0.6;
  if (days < 30) return 0.3;
  return 0.1;
}

/** Maximum boost a brand-new member receives. */
export const NEW_USER_BOOST = 0.1;

/**
 * New members have no interaction history, so they are given temporary
 * exposure: a boost that starts at NEW_USER_BOOST on day zero and decays
 * linearly to nothing at LIMITS.newMemberDays.
 */
export function newUserExploration(candidate: Candidate, now: number = Date.now()): number {
  const created = Date.parse(candidate.signals.createdAt);
  if (Number.isNaN(created)) return 0;
  const days = Math.max(0, (now - created) / DAY_MS);
  if (days >= LIMITS.newMemberDays) return 0;
  return round2(NEW_USER_BOOST * (1 - days / LIMITS.newMemberDays));
}

/** Exposure bucket around which the adjustment is neutral. */
export const EXPOSURE_PIVOT = 8;
export const EXPOSURE_RANGE = 0.05;

/**
 * Exposure balancing: members who have been surfaced less than the pivot get a
 * small lift, members surfaced more get a small penalty, bounded to
 * ±EXPOSURE_RANGE so it reorders near-ties rather than overriding fit.
 */
export function exposureAdjustment(candidate: Candidate): number {
  const bucket = Math.max(0, candidate.signals.exposureBucket);
  const ratio = clamp01(bucket / (2 * EXPOSURE_PIVOT));
  return round2(EXPOSURE_RANGE * (1 - 2 * ratio));
}

export function isNewMember(candidate: Candidate, now: number = Date.now()): boolean {
  const created = Date.parse(candidate.signals.createdAt);
  return !Number.isNaN(created) && now - created < LIMITS.newMemberDays * DAY_MS;
}

export function isRecentlyActive(candidate: Candidate, now: number = Date.now()): boolean {
  const last = Date.parse(candidate.signals.lastActiveAt);
  return !Number.isNaN(last) && now - last < LIMITS.activeWithinDays * DAY_MS;
}
