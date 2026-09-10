import { useMemo } from 'react';
import {
  AGE,
  AREAS,
  CHILDREN_OPTIONS,
  COUNTRIES,
  DEGREE_LEVEL_OPTIONS,
  DISTANCE_OPTIONS_MILES,
  DRINKING_OPTIONS,
  INDUSTRY_OPTIONS,
  INTERESTS,
  LANGUAGE_OPTIONS,
  RACE_ETHNICITY_OPTIONS,
  RELATIONSHIP_INTENT_OPTIONS,
  SMOKING_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  formatHeight,
  type MultiPreference,
  type MultiPreferenceKey,
  type PreferenceStrength,
  type Preferences,
  type RangePreferenceKey,
} from '@peaches/core';
import { Select } from './Field';
import { FilterRow } from './FilterRow';
import { MultiSelect, type MultiOption } from './MultiSelect';
import { SectionHeader } from './SectionHeader';

export interface LocationSettings {
  areaId: string | null;
  maxDistanceMiles: number;
}

interface MultiDimension {
  key: MultiPreferenceKey;
  label: string;
  options: ReadonlyArray<MultiOption>;
  searchable?: boolean;
}

const noPreferNotToSay = <T extends { value: string; label: string }>(opts: ReadonlyArray<T>) => opts.filter((o) => o.value !== 'prefer_not_to_say');

export const MULTI_DIMENSIONS: ReadonlyArray<MultiDimension> = [
  { key: 'nationalities', label: 'Nationality', options: COUNTRIES.map((c) => ({ value: c.code, label: c.name })), searchable: true },
  { key: 'raceEthnicities', label: 'Race / ethnicity', options: RACE_ETHNICITY_OPTIONS },
  { key: 'education', label: 'Education', options: DEGREE_LEVEL_OPTIONS },
  { key: 'occupation', label: 'Occupation', options: INDUSTRY_OPTIONS },
  { key: 'studentStatus', label: 'Student / professional', options: STUDENT_STATUS_OPTIONS },
  { key: 'languages', label: 'Languages', options: LANGUAGE_OPTIONS, searchable: true },
  { key: 'relationshipIntent', label: 'Relationship intent', options: RELATIONSHIP_INTENT_OPTIONS },
];

const LIFESTYLE_DIMENSIONS: ReadonlyArray<MultiDimension> = [
  { key: 'drinking', label: 'Drinking', options: noPreferNotToSay(DRINKING_OPTIONS) },
  { key: 'smoking', label: 'Smoking', options: noPreferNotToSay(SMOKING_OPTIONS) },
  { key: 'children', label: 'Children', options: noPreferNotToSay(CHILDREN_OPTIONS) },
];

const INTEREST_DIMENSION: MultiDimension = { key: 'interests', label: 'Interests', options: INTERESTS.map((i) => ({ value: i, label: i })), searchable: true };

const AGE_OPTIONS = Array.from({ length: AGE.max - AGE.min + 1 }, (_, i) => String(AGE.min + i)).map((v) => ({ value: v, label: v }));
const HEIGHT_OPTIONS = Array.from({ length: 85 - 56 + 1 }, (_, i) => Math.round((56 + i) * 2.54)).map((cm) => ({ value: String(cm), label: formatHeight(cm) }));
const AREA_OPTIONS = AREAS.map((a) => ({ value: a.id, label: a.name }));
const DISTANCE_OPTIONS = DISTANCE_OPTIONS_MILES.map((m) => ({ value: String(m), label: `${m} miles` }));

export function withMulti(prefs: Preferences, key: MultiPreferenceKey, patch: Partial<MultiPreference<string>>): Preferences {
  const current = prefs[key] as MultiPreference<string>;
  return { ...prefs, [key]: { ...current, ...patch } };
}

export function withRange(prefs: Preferences, key: RangePreferenceKey, patch: Partial<Preferences[RangePreferenceKey]>): Preferences {
  return { ...prefs, [key]: { ...prefs[key], ...patch } };
}

function RangeSelects({
  label,
  min,
  max,
  options,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  options: ReadonlyArray<MultiOption>;
  onChange: (min: number, max: number) => void;
}) {
  const nearest = (value: number) => {
    let best = options[0];
    for (const o of options) {
      if (Math.abs(Number(o.value) - value) < Math.abs(Number(best?.value ?? 0) - value)) best = o;
    }
    return best?.value ?? String(value);
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      <Select aria-label={`${label} minimum`} options={options} value={nearest(min)} onChange={(e) => onChange(Math.min(Number(e.target.value), max), max)} />
      <Select aria-label={`${label} maximum`} options={options} value={nearest(max)} onChange={(e) => onChange(min, Math.max(Number(e.target.value), min))} />
    </div>
  );
}

/**
 * The full preference set, one strength control per dimension. Location and
 * distance are not preferences: distance is a hard boundary and the area is
 * the member's private location.
 */
export function PreferencesEditor({
  prefs,
  onChange,
  location,
  onLocationChange,
}: {
  prefs: Preferences;
  onChange: (next: Preferences) => void;
  location: LocationSettings;
  onLocationChange: (next: LocationSettings) => void;
}) {
  const multiRow = (dim: MultiDimension) => {
    const pref = prefs[dim.key] as MultiPreference<string>;
    return (
      <FilterRow key={dim.key} label={dim.label} strength={pref.strength} onStrength={(s: PreferenceStrength) => onChange(withMulti(prefs, dim.key, { strength: s }))}>
        <MultiSelect label={dim.label} options={dim.options} values={pref.values} onChange={(values) => onChange(withMulti(prefs, dim.key, { values }))} searchable={dim.searchable} />
      </FilterRow>
    );
  };

  const distanceValue = useMemo(() => {
    const v = location.maxDistanceMiles;
    return DISTANCE_OPTIONS_MILES.includes(v) ? String(v) : String(DISTANCE_OPTIONS_MILES.find((d) => d >= v) ?? DISTANCE_OPTIONS_MILES[DISTANCE_OPTIONS_MILES.length - 1]);
  }, [location.maxDistanceMiles]);

  return (
    <div className="space-y-5">
      <FilterRow label="Location" hint="Only the area name is shown to others">
        <Select aria-label="Your area" options={AREA_OPTIONS} placeholder="Choose your area" value={location.areaId ?? ''} onChange={(e) => onLocationChange({ ...location, areaId: e.target.value || null })} />
      </FilterRow>
      <FilterRow label="Distance" hint="Hard boundary">
        <Select aria-label="Maximum distance" options={DISTANCE_OPTIONS} value={distanceValue} onChange={(e) => onLocationChange({ ...location, maxDistanceMiles: Number(e.target.value) })} />
      </FilterRow>
      <FilterRow label="Age" strength={prefs.ageRange.strength} onStrength={(s) => onChange(withRange(prefs, 'ageRange', { strength: s }))}>
        <RangeSelects label="Age" min={prefs.ageRange.min} max={prefs.ageRange.max} options={AGE_OPTIONS} onChange={(min, max) => onChange(withRange(prefs, 'ageRange', { min, max }))} />
      </FilterRow>
      {MULTI_DIMENSIONS.slice(0, 2).map(multiRow)}
      <FilterRow label="Height" strength={prefs.height.strength} onStrength={(s) => onChange(withRange(prefs, 'height', { strength: s }))}>
        <RangeSelects label="Height" min={prefs.height.min} max={prefs.height.max} options={HEIGHT_OPTIONS} onChange={(min, max) => onChange(withRange(prefs, 'height', { min, max }))} />
      </FilterRow>
      {MULTI_DIMENSIONS.slice(2).map(multiRow)}
      <div>
        <SectionHeader title="Lifestyle" />
        <div className="space-y-4">{LIFESTYLE_DIMENSIONS.map(multiRow)}</div>
      </div>
      {multiRow(INTEREST_DIMENSION)}
    </div>
  );
}
