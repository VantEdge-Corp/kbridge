import { describe, expect, it } from 'vitest';
import { profileDetails, profileMetaLine, profileVitals } from '../src/profileFacts';
import { profile } from './fixtures';

describe('profileVitals', () => {
  it('lists what is present, in order, as self-describing values', () => {
    const p = profile({
      id: 'a',
      height: 170,
      relationshipIntent: 'long_term',
      lifestyle: { drinking: 'socially', smoking: 'never', exercise: 'often', children: 'wants_children' },
    });
    expect(profileVitals(p)).toEqual([
      { kind: 'height', label: 'Height', value: `5'7"` },
      { kind: 'area', label: 'Area', value: 'Midtown Atlanta' },
      { kind: 'intent', label: 'Looking for', value: 'Long-term relationship' },
      { kind: 'children', label: 'Children', value: 'Wants children' },
      { kind: 'drinking', label: 'Drinking', value: 'Drinks socially' },
      { kind: 'smoking', label: 'Smoking', value: "Doesn't smoke" },
      { kind: 'exercise', label: 'Exercise', value: 'Exercises often' },
    ]);
  });

  it('leaves out what is missing and what the member preferred not to say', () => {
    const p = profile({
      id: 'b',
      height: null,
      displayArea: '',
      lifestyle: { drinking: 'prefer_not_to_say', smoking: 'prefer_not_to_say', exercise: null, children: 'prefer_not_to_say' },
    });
    expect(profileVitals(p)).toEqual([]);
  });
});

describe('profileDetails', () => {
  it('reads as phrases, with lists joined in plain English', () => {
    const p = profile({
      id: 'c',
      employmentDisplay: 'Attorney · King & Spalding',
      educationDisplay: 'Emory University',
      industry: 'law',
      studentStatus: 'professional',
      nationalities: ['NG', 'US'],
      languages: ['en', 'yo', 'fr'],
      raceEthnicityDisclosure: 'disclosed',
      raceEthnicities: ['black_african_descent'],
    });
    expect(profileDetails(p).map((f) => [f.kind, f.value])).toEqual([
      ['work', 'Attorney · King & Spalding'],
      ['education', 'Emory University'],
      ['field', 'Law · Working professional'],
      ['nationality', 'From Nigeria and United States'],
      ['languages', 'Speaks English, Yoruba, and French'],
      ['ethnicity', 'Black / African descent'],
    ]);
  });

  it('shows ethnicity only when it was disclosed', () => {
    const p = profile({ id: 'd', raceEthnicityDisclosure: 'prefer_not_to_say', raceEthnicities: ['east_asian'] });
    expect(profileDetails(p).some((f) => f.kind === 'ethnicity')).toBe(false);
  });

  it('falls back to the occupation for work', () => {
    const p = profile({ id: 'e', employmentDisplay: '', occupation: 'Nurse' });
    expect(profileDetails(p)[0]).toEqual({ kind: 'work', label: 'Work', value: 'Nurse' });
  });
});

describe('profileMetaLine', () => {
  it('joins what someone does and where, skipping what is missing', () => {
    expect(profileMetaLine(profile({ id: 'f', occupation: 'Product designer' }))).toBe('Product designer · Midtown Atlanta');
    expect(profileMetaLine(profile({ id: 'g', occupation: '', employmentDisplay: '' }))).toBe('Midtown Atlanta');
    expect(profileMetaLine(profile({ id: 'h', displayArea: '' }))).toBe('Analyst');
  });
});
