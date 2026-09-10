import { describe, expect, it } from 'vitest';
import {
  activitySignal,
  compatibility,
  compatibilityAB,
  compatibilityBA,
  demandSignal,
  distanceSignal,
  eligible,
  exposureAdjustment,
  newUserExploration,
  rankActive,
  rankForYou,
  rankNearby,
  rankNew,
  reciprocalCompatibility,
  recommendationScore,
} from '../src/matching';
import { defaultPreferences } from '../src/types/preferences';
import { NOW, candidate, viewer } from './fixtures';

describe('eligible', () => {
  it('excludes the viewer themself and anyone past the distance boundary', () => {
    const v = viewer();
    expect(eligible(v, candidate({ id: 'viewer' }))).toBe(false);
    expect(eligible(v, candidate({ id: 'far' }, { distanceMiles: 26 }))).toBe(false);
    expect(eligible(v, candidate({ id: 'near' }, { distanceMiles: 25 }))).toBe(true);
  });

  it('applies required dimensions as hard filters and ignores any/preferred', () => {
    const prefs = defaultPreferences();
    prefs.nationalities = { strength: 'required', values: ['KR', 'US'] };
    prefs.languages = { strength: 'preferred', values: ['ko'] };
    const v = viewer({ preferences: prefs });
    expect(eligible(v, candidate({ id: 'a', nationalities: ['KR'] }))).toBe(true);
    expect(eligible(v, candidate({ id: 'b', nationalities: ['FR'] }))).toBe(false);
    expect(eligible(v, candidate({ id: 'c', nationalities: [] }))).toBe(false);
    // preferred languages never exclude
    expect(eligible(v, candidate({ id: 'd', nationalities: ['US'], languages: ['en'] }))).toBe(true);
  });

  it('treats a required multi preference with no values as any', () => {
    const prefs = defaultPreferences();
    prefs.raceEthnicities = { strength: 'required', values: [] };
    expect(eligible(viewer({ preferences: prefs }), candidate({ id: 'a' }))).toBe(true);
  });

  it('requires an in-range age when age is required, with no tolerance', () => {
    const prefs = defaultPreferences();
    prefs.ageRange = { strength: 'required', min: 25, max: 30 };
    const v = viewer({ preferences: prefs });
    expect(eligible(v, candidate({ id: 'a', age: 31 }))).toBe(false);
    expect(eligible(v, candidate({ id: 'b', age: 30 }))).toBe(true);
    expect(eligible(v, candidate({ id: 'c', age: null }))).toBe(false);
  });

  it('never lets an undisclosed race/ethnicity satisfy a required filter', () => {
    const prefs = defaultPreferences();
    prefs.raceEthnicities = { strength: 'required', values: ['east_asian'] };
    const v = viewer({ preferences: prefs });
    expect(
      eligible(v, candidate({ id: 'a', raceEthnicities: [], raceEthnicityDisclosure: 'prefer_not_to_say' })),
    ).toBe(false);
    expect(
      eligible(v, candidate({ id: 'b', raceEthnicities: ['east_asian'], raceEthnicityDisclosure: 'disclosed' })),
    ).toBe(true);
  });
});

describe('compatibility', () => {
  it('is neutral when nothing is preferred', () => {
    const prefs = defaultPreferences();
    prefs.ageRange.strength = 'any';
    expect(compatibility(prefs, candidate({ id: 'a' }).profile)).toBe(0.5);
  });

  it('counts only preferred dimensions with OR semantics', () => {
    const prefs = defaultPreferences();
    prefs.ageRange = { strength: 'any', min: 20, max: 40 };
    prefs.languages = { strength: 'preferred', values: ['ko', 'es'] };
    prefs.interests = { strength: 'preferred', values: ['Tennis', 'Jazz'] };
    prefs.nationalities = { strength: 'required', values: ['US'] };
    const p = candidate({ id: 'a', languages: ['en', 'es'], interests: ['Golf'], nationalities: ['US'] }).profile;
    expect(compatibility(prefs, p)).toBe(0.5);
  });

  it('gives partial credit just outside a preferred range', () => {
    const prefs = defaultPreferences();
    prefs.ageRange = { strength: 'preferred', min: 25, max: 30 };
    expect(compatibility(prefs, candidate({ id: 'a', age: 32 }).profile)).toBe(0.5);
    expect(compatibility(prefs, candidate({ id: 'b', age: 34 }).profile)).toBe(0);
    expect(compatibility(prefs, candidate({ id: 'c', age: 28 }).profile)).toBe(1);
  });

  it('skips prefer-not-to-say dimensions entirely', () => {
    const prefs = defaultPreferences();
    prefs.ageRange.strength = 'any';
    prefs.raceEthnicities = { strength: 'preferred', values: ['white'] };
    prefs.languages = { strength: 'preferred', values: ['en'] };
    const undisclosed = candidate({ id: 'a', raceEthnicityDisclosure: 'prefer_not_to_say', languages: ['en'] }).profile;
    expect(compatibility(prefs, undisclosed)).toBe(1);
    const disclosedOther = candidate({
      id: 'b',
      raceEthnicityDisclosure: 'disclosed',
      raceEthnicities: ['south_asian'],
      languages: ['en'],
    }).profile;
    expect(compatibility(prefs, disclosedOther)).toBe(0.5);
  });

  it('is directional: A->B and B->A are computed separately', () => {
    const prefs = defaultPreferences();
    prefs.ageRange.strength = 'any';
    prefs.languages = { strength: 'preferred', values: ['fr'] };
    const v = viewer({ preferences: prefs });
    const c = candidate({ id: 'b', languages: ['en'] }, { reverseCompatibility: 0.9 });
    expect(compatibilityAB(v, c)).toBe(0);
    expect(compatibilityBA(v, c)).toBe(0.9);
    expect(reciprocalCompatibility(v, c)).toBe(0);
  });

  it('reciprocal compatibility rewards balance', () => {
    const v = viewer();
    v.preferences.ageRange = { strength: 'preferred', min: 25, max: 35 };
    const balanced = candidate({ id: 'a', age: 30 }, { reverseCompatibility: 1 });
    const lopsided = candidate({ id: 'b', age: 30 }, { reverseCompatibility: 0.2 });
    expect(reciprocalCompatibility(v, balanced)).toBe(1);
    expect(reciprocalCompatibility(v, lopsided)).toBeCloseTo(0.33, 2);
  });
});

describe('signals', () => {
  it('distance is a modest advantage inside the radius', () => {
    const v = viewer({ maxDistanceMiles: 20 });
    expect(distanceSignal(v, candidate({ id: 'a' }, { distanceMiles: 0 }))).toBe(1);
    expect(distanceSignal(v, candidate({ id: 'b' }, { distanceMiles: 10 }))).toBe(0.75);
    expect(distanceSignal(v, candidate({ id: 'c' }, { distanceMiles: 20 }))).toBe(0.5);
  });

  it('demand has diminishing returns and saturates', () => {
    const d = (bucket: number) => demandSignal(candidate({ id: 'a' }, { demandBucket: bucket }));
    expect(d(0)).toBe(0);
    expect(d(1) - d(0)).toBeGreaterThan(d(21) - d(13));
    expect(d(21)).toBeLessThanOrEqual(1);
    expect(d(500)).toBe(1);
  });

  it('activity steps down by recency', () => {
    const a = (iso: string) => activitySignal(candidate({ id: 'a' }, { lastActiveAt: iso }), NOW);
    expect(a('2026-09-10T00:00:00Z')).toBe(1);
    expect(a('2026-09-08T00:00:00Z')).toBe(0.8);
    expect(a('2026-09-05T00:00:00Z')).toBe(0.6);
    expect(a('2026-08-20T00:00:00Z')).toBe(0.3);
    expect(a('2026-01-01T00:00:00Z')).toBe(0.1);
  });

  it('new members get a decaying boost', () => {
    const n = (iso: string) => newUserExploration(candidate({ id: 'a' }, { createdAt: iso }), NOW);
    expect(n('2026-09-10T12:00:00Z')).toBe(0.1);
    expect(n('2026-09-03T12:00:00Z')).toBe(0.05);
    expect(n('2026-08-01T00:00:00Z')).toBe(0);
  });

  it('exposure balancing is bounded and symmetric around the pivot', () => {
    const e = (bucket: number) => exposureAdjustment(candidate({ id: 'a' }, { exposureBucket: bucket }));
    expect(e(0)).toBe(0.05);
    expect(e(8)).toBe(0);
    expect(e(16)).toBe(-0.05);
    expect(e(64)).toBe(-0.05);
  });

  it('nationality and race never change demand or exposure', () => {
    const base = candidate({ id: 'a' }, { demandBucket: 5, exposureBucket: 4 });
    const other = candidate(
      { id: 'a', nationalities: ['KR', 'NG'], raceEthnicities: ['black_african_descent'], raceEthnicityDisclosure: 'disclosed' },
      { demandBucket: 5, exposureBucket: 4 },
    );
    expect(demandSignal(other)).toBe(demandSignal(base));
    expect(exposureAdjustment(other)).toBe(exposureAdjustment(base));
  });
});

describe('recommendationScore and sections', () => {
  it('weights compatibility and reciprocity above demand', () => {
    const v = viewer();
    v.preferences.ageRange = { strength: 'preferred', min: 25, max: 35 };
    const fit = candidate({ id: 'fit', age: 30 }, { reverseCompatibility: 1, demandBucket: 0 });
    const popular = candidate({ id: 'popular', age: 45 }, { reverseCompatibility: 0.1, demandBucket: 21 });
    expect(recommendationScore(v, fit, NOW)).toBeGreaterThan(recommendationScore(v, popular, NOW));
  });

  it('is deterministic and tie-breaks by id', () => {
    const v = viewer();
    const a = candidate({ id: 'b' });
    const b = candidate({ id: 'a' });
    const first = rankForYou(v, [a, b], NOW).map((c) => c.profile.id);
    const second = rankForYou(v, [b, a], NOW).map((c) => c.profile.id);
    expect(first).toEqual(['a', 'b']);
    expect(second).toEqual(first);
  });

  it('nearby orders by distance, new by join date, active by recency', () => {
    const v = viewer();
    const near = candidate({ id: 'near' }, { distanceMiles: 2, createdAt: '2026-06-01T00:00:00Z', lastActiveAt: '2026-09-01T00:00:00Z' });
    const far = candidate({ id: 'far' }, { distanceMiles: 20, createdAt: '2026-09-09T00:00:00Z', lastActiveAt: '2026-09-10T00:00:00Z' });
    expect(rankNearby(v, [far, near], NOW).map((c) => c.profile.id)).toEqual(['near', 'far']);
    expect(rankNew(v, [near, far], NOW).map((c) => c.profile.id)).toEqual(['far']);
    expect(rankActive(v, [near, far], NOW).map((c) => c.profile.id)).toEqual(['far']);
  });
});

describe('display strings (mirrored by the SQL trigger in migration 013)', () => {
  it('formats education and employment lines', async () => {
    const { educationDisplay, employmentDisplay, formatHeight } = await import('../src/format');
    expect(educationDisplay('Georgia Institute of Technology', 'master', 'Analytics')).toBe(
      "Georgia Institute of Technology · Master's, Analytics",
    );
    expect(educationDisplay('Emory University', 'professional', '')).toBe('Emory University · Professional degree');
    expect(educationDisplay('', null, '')).toBe('');
    expect(employmentDisplay('Product designer', 'Greenlight', true)).toBe('Product designer · Greenlight');
    expect(employmentDisplay('Product designer', 'Greenlight', false)).toBe('Product designer');
    expect(formatHeight(178)).toBe(`5'10"`);
  });
});
