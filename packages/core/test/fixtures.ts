import type { Candidate, Viewer } from '../src/matching/types';
import type { PublicProfile, RecommendationSignals } from '../src/types/profile';
import { defaultPreferences } from '../src/types/preferences';

export const NOW = Date.parse('2026-09-10T12:00:00Z');

export function profile(overrides: Partial<PublicProfile> & { id: string }): PublicProfile {
  return {
    firstName: 'Member',
    age: 30,
    height: 175,
    photos: [],
    occupation: 'Analyst',
    employmentDisplay: 'Analyst',
    educationDisplay: null,
    educationDegreeLevel: null,
    industry: null,
    studentStatus: 'professional',
    nationalities: [],
    raceEthnicities: [],
    raceEthnicityDisclosure: 'not_provided',
    languages: ['en'],
    displayArea: 'Midtown Atlanta',
    relationshipIntent: null,
    lifestyle: { drinking: null, smoking: null, exercise: null, children: null },
    interests: [],
    bio: '',
    publicVerificationBadges: [],
    ...overrides,
  };
}

export function signals(overrides: Partial<RecommendationSignals> & { profileId: string }): RecommendationSignals {
  return {
    distanceMiles: 5,
    demandBucket: 0,
    exposureBucket: 0,
    lastActiveAt: '2026-09-10T00:00:00Z',
    createdAt: '2026-06-01T00:00:00Z',
    reverseCompatibility: 0.5,
    reverseEligible: true,
    ...overrides,
  };
}

export function candidate(p: Partial<PublicProfile> & { id: string }, s: Partial<RecommendationSignals> = {}): Candidate {
  return { profile: profile(p), signals: signals({ profileId: p.id, ...s }) };
}

export function viewer(overrides: Partial<Viewer> = {}): Viewer {
  return {
    profile: profile({ id: 'viewer', firstName: 'Viewer' }),
    preferences: defaultPreferences(),
    maxDistanceMiles: 25,
    ...overrides,
  };
}
