import type {
  ChildrenPlan,
  DegreeLevel,
  DrinkingHabit,
  Industry,
  RaceEthnicity,
  RelationshipIntent,
  SmokingHabit,
  StudentStatus,
} from './profile';

/**
 * Every relevant preference dimension carries its own strength:
 *   required  - hard requirement; a candidate that fails is excluded
 *   preferred - soft preference; a match earns compatibility priority
 *   any       - neutral; contributes nothing to eligibility or compatibility
 */
export type PreferenceStrength = 'required' | 'preferred' | 'any';

export const PREFERENCE_STRENGTHS: readonly PreferenceStrength[] = ['required', 'preferred', 'any'];

export interface RangePreference {
  strength: PreferenceStrength;
  min: number;
  max: number;
}

/** Multi-value preferences use OR semantics: a candidate matches if any value matches. */
export interface MultiPreference<T extends string = string> {
  strength: PreferenceStrength;
  values: T[];
}

export interface Preferences {
  ageRange: RangePreference;
  /** Centimetres. */
  height: RangePreference;
  nationalities: MultiPreference<string>;
  raceEthnicities: MultiPreference<RaceEthnicity>;
  languages: MultiPreference<string>;
  education: MultiPreference<DegreeLevel>;
  occupation: MultiPreference<Industry>;
  studentStatus: MultiPreference<StudentStatus>;
  relationshipIntent: MultiPreference<RelationshipIntent>;
  drinking: MultiPreference<DrinkingHabit>;
  smoking: MultiPreference<SmokingHabit>;
  children: MultiPreference<ChildrenPlan>;
  interests: MultiPreference<string>;
}

export type PreferenceKey = keyof Preferences;

export const RANGE_PREFERENCE_KEYS = ['ageRange', 'height'] as const satisfies readonly PreferenceKey[];

export const MULTI_PREFERENCE_KEYS = [
  'nationalities',
  'raceEthnicities',
  'languages',
  'education',
  'occupation',
  'studentStatus',
  'relationshipIntent',
  'drinking',
  'smoking',
  'children',
  'interests',
] as const satisfies readonly PreferenceKey[];

export type RangePreferenceKey = (typeof RANGE_PREFERENCE_KEYS)[number];
export type MultiPreferenceKey = (typeof MULTI_PREFERENCE_KEYS)[number];

export const PREFERENCE_LABEL: Record<PreferenceKey, string> = {
  ageRange: 'Age',
  height: 'Height',
  nationalities: 'Nationality',
  raceEthnicities: 'Race / ethnicity',
  languages: 'Languages',
  education: 'Education',
  occupation: 'Occupation',
  studentStatus: 'Student / professional',
  relationshipIntent: 'Relationship intent',
  drinking: 'Drinking',
  smoking: 'Smoking',
  children: 'Children',
  interests: 'Interests',
};

export function defaultPreferences(): Preferences {
  return {
    ageRange: { strength: 'preferred', min: 24, max: 38 },
    height: { strength: 'any', min: 150, max: 200 },
    nationalities: { strength: 'any', values: [] },
    raceEthnicities: { strength: 'any', values: [] },
    languages: { strength: 'any', values: [] },
    education: { strength: 'any', values: [] },
    occupation: { strength: 'any', values: [] },
    studentStatus: { strength: 'any', values: [] },
    relationshipIntent: { strength: 'any', values: [] },
    drinking: { strength: 'any', values: [] },
    smoking: { strength: 'any', values: [] },
    children: { strength: 'any', values: [] },
    interests: { strength: 'any', values: [] },
  };
}

/** A multi preference with no values selected behaves as `any`, whatever its strength. */
export function effectiveStrength(pref: MultiPreference | RangePreference): PreferenceStrength {
  if ('values' in pref && pref.values.length === 0) return 'any';
  return pref.strength;
}
