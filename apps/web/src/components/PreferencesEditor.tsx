import type { ReactNode } from 'react';
import {
  AGE,
  AREAS,
  CHILDREN_OPTIONS,
  COUNTRIES,
  DEGREE_LEVEL_OPTIONS,
  DISTANCE_OPTIONS_MILES,
  DRINKING_OPTIONS,
  HEIGHT_CM,
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
import { MultiSelectField, SearchSelectField, SelectField, type Option } from '@/components/form';
import { PreferenceStrengthSelector } from '@/components/PreferenceStrengthSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface LocationSettings {
  areaId: string | null;
  maxDistanceMiles: number;
}

interface MultiDimension {
  key: MultiPreferenceKey;
  label: string;
  options: ReadonlyArray<Option>;
}

const noPreferNotToSay = <T extends Option>(opts: ReadonlyArray<T>) => opts.filter((o) => o.value !== 'prefer_not_to_say');

const BACKGROUND_DIMENSIONS: ReadonlyArray<MultiDimension> = [
  { key: 'nationalities', label: 'Nationality', options: COUNTRIES.map((c) => ({ value: c.code, label: c.name })) },
  { key: 'raceEthnicities', label: 'Race / ethnicity', options: RACE_ETHNICITY_OPTIONS },
  { key: 'education', label: 'Education', options: DEGREE_LEVEL_OPTIONS },
  { key: 'occupation', label: 'Occupation', options: INDUSTRY_OPTIONS },
  { key: 'studentStatus', label: 'Student / professional', options: STUDENT_STATUS_OPTIONS },
  { key: 'languages', label: 'Languages', options: LANGUAGE_OPTIONS },
];

const INTENT_DIMENSIONS: ReadonlyArray<MultiDimension> = [
  { key: 'relationshipIntent', label: 'Relationship intent', options: RELATIONSHIP_INTENT_OPTIONS },
  { key: 'drinking', label: 'Drinking', options: noPreferNotToSay(DRINKING_OPTIONS) },
  { key: 'smoking', label: 'Smoking', options: noPreferNotToSay(SMOKING_OPTIONS) },
  { key: 'children', label: 'Children', options: noPreferNotToSay(CHILDREN_OPTIONS) },
];

const INTEREST_DIMENSION: MultiDimension = { key: 'interests', label: 'Interests', options: INTERESTS.map((i) => ({ value: i, label: i })) };

const AREA_OPTIONS = AREAS.map((a) => ({ value: a.id, label: a.name }));
const DISTANCE_OPTIONS = DISTANCE_OPTIONS_MILES.map((m) => ({ value: String(m), label: `Within ${m} miles` }));

export function withMulti(prefs: Preferences, key: MultiPreferenceKey, patch: Partial<MultiPreference<string>>): Preferences {
  const current = prefs[key] as MultiPreference<string>;
  return { ...prefs, [key]: { ...current, ...patch } };
}

export function withRange(prefs: Preferences, key: RangePreferenceKey, patch: Partial<Preferences[RangePreferenceKey]>): Preferences {
  return { ...prefs, [key]: { ...prefs[key], ...patch } };
}

/** A label with its own strength control, then the value control. "Any" dims the control: it is left out of matching. */
function PreferenceRow({ label, hint, strength, onStrength, children }: { label: string; hint?: ReactNode; strength?: PreferenceStrength; onStrength?: (s: PreferenceStrength) => void; children: ReactNode }) {
  return (
    <div className="grid gap-3">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {strength && onStrength ? <PreferenceStrengthSelector value={strength} onChange={onStrength} label={label} /> : null}
      </div>
      <div className={cn('transition-opacity', strength === 'any' && 'opacity-60')}>{children}</div>
    </div>
  );
}

function RangeRow({ label, min, max, bounds, step = 1, format, onChange }: { label: string; min: number; max: number; bounds: { min: number; max: number }; step?: number; format: (v: number) => string; onChange: (min: number, max: number) => void }) {
  const noun = label.toLowerCase();
  return (
    <div className="grid gap-3 pt-1">
      <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {format(min)} to {format(max)}
      </p>
      <Slider
        value={[min, max]}
        min={bounds.min}
        max={bounds.max}
        step={step}
        minStepsBetweenValues={0}
        onValueChange={(value) => {
          if (Array.isArray(value) && value.length === 2) onChange(value[0] ?? min, value[1] ?? max);
        }}
        getAriaLabel={(index) => (index === 0 ? `Minimum ${noun}` : `Maximum ${noun}`)}
        getAriaValueText={(_formatted, value) => format(value)}
      />
    </div>
  );
}

function PreferenceCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="gap-0">{children}</CardContent>
    </Card>
  );
}

/** Rows inside a card, separated by hairlines. */
function Rows({ children }: { children: ReactNode[] }) {
  return (
    <div className="grid gap-4">
      {children.map((child, i) => (
        <div key={i} className="grid gap-4">
          {i > 0 ? <Separator /> : null}
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * The full preference set, one strength control per dimension, in cards.
 * Location and distance are not preferences: distance is a hard boundary and
 * the area is the member's private location.
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
      <PreferenceRow key={dim.key} label={dim.label} strength={pref.strength} onStrength={(s) => onChange(withMulti(prefs, dim.key, { strength: s }))}>
        <MultiSelectField aria-label={dim.label} options={dim.options} values={pref.values} onValuesChange={(values) => onChange(withMulti(prefs, dim.key, { values }))} />
      </PreferenceRow>
    );
  };

  const distanceValue = DISTANCE_OPTIONS_MILES.includes(location.maxDistanceMiles)
    ? String(location.maxDistanceMiles)
    : String(DISTANCE_OPTIONS_MILES.find((d) => d >= location.maxDistanceMiles) ?? DISTANCE_OPTIONS_MILES[DISTANCE_OPTIONS_MILES.length - 1]);

  return (
    <div className="grid gap-4">
      <PreferenceCard title="Location" description="Others only ever see your area's name. Distance is a hard boundary.">
        <Rows>
          {[
            <SearchSelectField key="area" label="Your area" aria-label="Your area" options={AREA_OPTIONS} placeholder="Choose your area" value={location.areaId ?? ''} onValueChange={(v) => onLocationChange({ ...location, areaId: v || null })} />,
            <SelectField key="distance" label="Distance" aria-label="Maximum distance" options={DISTANCE_OPTIONS} value={distanceValue} onValueChange={(v) => onLocationChange({ ...location, maxDistanceMiles: Number(v || location.maxDistanceMiles) })} />,
          ]}
        </Rows>
      </PreferenceCard>
      <PreferenceCard title="Basics">
        <Rows>
          {[
            <PreferenceRow key="age" label="Age" strength={prefs.ageRange.strength} onStrength={(s) => onChange(withRange(prefs, 'ageRange', { strength: s }))}>
              <RangeRow label="Age" min={prefs.ageRange.min} max={prefs.ageRange.max} bounds={AGE} format={String} onChange={(min, max) => onChange(withRange(prefs, 'ageRange', { min, max }))} />
            </PreferenceRow>,
            <PreferenceRow key="height" label="Height" strength={prefs.height.strength} onStrength={(s) => onChange(withRange(prefs, 'height', { strength: s }))}>
              <RangeRow label="Height" min={prefs.height.min} max={prefs.height.max} bounds={HEIGHT_CM} step={1} format={formatHeight} onChange={(min, max) => onChange(withRange(prefs, 'height', { min, max }))} />
            </PreferenceRow>,
          ]}
        </Rows>
      </PreferenceCard>
      <PreferenceCard title="Background">
        <Rows>{BACKGROUND_DIMENSIONS.map(multiRow)}</Rows>
      </PreferenceCard>
      <PreferenceCard title="Intent and lifestyle">
        <Rows>{INTENT_DIMENSIONS.map(multiRow)}</Rows>
      </PreferenceCard>
      <PreferenceCard title="Interests">
        <Rows>{[multiRow(INTEREST_DIMENSION)]}</Rows>
      </PreferenceCard>
    </div>
  );
}
