import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  PREFERENCE_LABEL,
  RACE_ETHNICITY_OPTIONS,
  RELATIONSHIP_INTENT_OPTIONS,
  SMOKING_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  areaById,
  formatHeight,
  type MultiPreferenceKey,
  type Preferences,
  type PreferenceStrength,
} from '@peaches/core';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { FilterRow } from './FilterRow';
import { Group } from './Group';
import { PickerModal, type PickerOption } from './PickerModal';
import { RangeStepper } from './RangeStepper';
import { SectionHeader } from './SectionHeader';

interface Props {
  prefs: Preferences;
  onChange: (next: Preferences) => void;
  areaId: string | null;
  maxDistanceMiles: number;
  onAreaChange: (areaId: string | null) => void;
  onDistanceChange: (miles: number) => void;
}

export const PREFERENCE_OPTIONS: Record<MultiPreferenceKey, ReadonlyArray<PickerOption>> = {
  nationalities: COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
  raceEthnicities: RACE_ETHNICITY_OPTIONS,
  languages: LANGUAGE_OPTIONS,
  education: DEGREE_LEVEL_OPTIONS,
  occupation: INDUSTRY_OPTIONS,
  studentStatus: STUDENT_STATUS_OPTIONS,
  relationshipIntent: RELATIONSHIP_INTENT_OPTIONS,
  drinking: DRINKING_OPTIONS.filter((o) => o.value !== 'prefer_not_to_say'),
  smoking: SMOKING_OPTIONS.filter((o) => o.value !== 'prefer_not_to_say'),
  children: CHILDREN_OPTIONS.filter((o) => o.value !== 'prefer_not_to_say'),
  interests: INTERESTS.map((i) => ({ value: i, label: i })),
};

const SECTIONS: ReadonlyArray<{ title: string; keys: MultiPreferenceKey[] }> = [
  { title: 'Background', keys: ['nationalities', 'raceEthnicities', 'languages', 'education', 'occupation', 'studentStatus'] },
  { title: 'Intent', keys: ['relationshipIntent'] },
  { title: 'Lifestyle', keys: ['drinking', 'smoking', 'children'] },
  { title: 'Interests', keys: ['interests'] },
];

const AREA_OPTIONS: PickerOption[] = AREAS.map((a) => ({ value: a.id, label: a.name }));
const DISTANCE_OPTIONS: PickerOption[] = DISTANCE_OPTIONS_MILES.map((m) => ({ value: String(m), label: `${m} miles` }));

type Open = MultiPreferenceKey | 'area' | 'distance' | null;

/** "Korean, English +1" for a multi preference; "Any" when nothing is selected. */
export function summarizeValues(key: MultiPreferenceKey, values: readonly string[], max = 3): string {
  if (values.length === 0) return 'Any';
  const labels = values.map((v) => PREFERENCE_OPTIONS[key].find((o) => o.value === v)?.label ?? v);
  return labels.length > max ? `${labels.slice(0, max).join(', ')} +${labels.length - max}` : labels.join(', ');
}

/**
 * Every dimension carries its own Required / Preferred / Any strength.
 * Location and distance are the viewer's private search region; distance is
 * always a hard boundary, so it has no strength control.
 */
export function PreferenceEditor({ prefs, onChange, areaId, maxDistanceMiles, onAreaChange, onDistanceChange }: Props) {
  const { text } = useTheme();
  const [open, setOpen] = useState<Open>(null);

  const summaries = useMemo(() => {
    const out = {} as Record<MultiPreferenceKey, string>;
    for (const key of Object.keys(PREFERENCE_OPTIONS) as MultiPreferenceKey[]) out[key] = summarizeValues(key, prefs[key].values);
    return out;
  }, [prefs]);

  const setStrength = (key: keyof Preferences, strength: PreferenceStrength) => {
    onChange({ ...prefs, [key]: { ...prefs[key], strength } });
  };
  const setValues = (key: MultiPreferenceKey, values: string[]) => {
    onChange({ ...prefs, [key]: { ...prefs[key], values } });
  };

  const area = areaById(areaId);

  return (
    <View>
      <SectionHeader title="Location" first />
      <Group>
        <FilterRow label="Location" summary={area ? area.name : 'Choose your area'} onPress={() => setOpen('area')} />
        <FilterRow label="Distance" summary={`Within ${maxDistanceMiles} miles`} onPress={() => setOpen('distance')} />
      </Group>
      <Text style={[text.caption, styles.note]}>Distance is a hard boundary. Others only ever see your area label, never an address.</Text>

      <SectionHeader title="Basics" />
      <Group>
      <FilterRow
        label={PREFERENCE_LABEL.ageRange}
        summary=""
        strength={prefs.ageRange.strength}
        onStrengthChange={(s) => setStrength('ageRange', s)}
        control={
          <RangeStepper
            min={prefs.ageRange.min}
            max={prefs.ageRange.max}
            bounds={AGE}
            format={(v) => String(v)}
            onChange={(min, max) => onChange({ ...prefs, ageRange: { ...prefs.ageRange, min, max } })}
          />
        }
      />
      <FilterRow
        label={PREFERENCE_LABEL.height}
        summary=""
        strength={prefs.height.strength}
        onStrengthChange={(s) => setStrength('height', s)}
        control={
          <RangeStepper
            min={prefs.height.min}
            max={prefs.height.max}
            bounds={HEIGHT_CM}
            step={3}
            format={formatHeight}
            onChange={(min, max) => onChange({ ...prefs, height: { ...prefs.height, min, max } })}
          />
        }
      />
      </Group>

      {SECTIONS.map((section) => (
        <View key={section.title}>
          <SectionHeader title={section.title} />
          <Group>
            {section.keys.map((key) => (
              <FilterRow
                key={key}
                label={PREFERENCE_LABEL[key]}
                summary={summaries[key]}
                onPress={() => setOpen(key)}
                strength={prefs[key].strength}
                onStrengthChange={(s) => setStrength(key, s)}
              />
            ))}
          </Group>
        </View>
      ))}
      <Text style={[text.caption, styles.note]}>
        Required excludes anyone who doesn&apos;t match. Preferred gives matches priority. Any ignores the dimension. Members who chose
        &quot;Prefer not to say&quot; are never matched on that dimension.
      </Text>

      {open && open !== 'area' && open !== 'distance' ? (
        <PickerModal
          visible
          onClose={() => setOpen(null)}
          title={PREFERENCE_LABEL[open]}
          options={PREFERENCE_OPTIONS[open]}
          selected={prefs[open].values}
          onChange={(values) => setValues(open, values)}
          multi
        />
      ) : null}
      <PickerModal
        visible={open === 'area'}
        onClose={() => setOpen(null)}
        title="Your area"
        options={AREA_OPTIONS}
        selected={areaId ? [areaId] : []}
        onChange={(values) => onAreaChange(values[0] ?? null)}
      />
      <PickerModal
        visible={open === 'distance'}
        onClose={() => setOpen(null)}
        title="Maximum distance"
        options={DISTANCE_OPTIONS}
        selected={[String(maxDistanceMiles)]}
        onChange={(values) => onDistanceChange(Number(values[0] ?? maxDistanceMiles))}
        searchable={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  note: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
