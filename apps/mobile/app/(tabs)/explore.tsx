import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MULTI_PREFERENCE_KEYS, PREFERENCE_LABEL, RANGE_PREFERENCE_KEYS, effectiveStrength, formatHeight, rankForYou, type Preferences } from '@peaches/core';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorText } from '@/components/ErrorText';
import { FiltersSheet } from '@/components/FiltersSheet';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Loading } from '@/components/Loading';
import { PeopleGrid } from '@/components/PeopleGrid';
import { summarizeValues } from '@/components/PreferenceEditor';
import { Screen } from '@/components/Screen';
import { TagChip } from '@/components/TagChip';
import { radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { useCandidates } from '@/hooks/useCandidates';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

interface ActiveFilter {
  key: string;
  label: string;
  /** Required filters are drawn as selected (ivory) chips, preferred ones as outline chips. */
  required: boolean;
}

/** Short chip names; the full labels live in PREFERENCE_LABEL for the filter sheet. */
const CHIP_LABEL: Partial<Record<keyof Preferences, string>> = {
  raceEthnicities: 'Ethnicity',
  studentStatus: 'Standing',
  relationshipIntent: 'Intent',
  occupation: 'Field',
};

/** Distance first, then every dimension that is not "Any", each with a short value. */
function activeFilters(prefs: Preferences, maxDistanceMiles: number): ActiveFilter[] {
  const out: ActiveFilter[] = [{ key: 'distance', label: `Within ${maxDistanceMiles} mi`, required: false }];
  for (const key of RANGE_PREFERENCE_KEYS) {
    const strength = effectiveStrength(prefs[key]);
    if (strength === 'any') continue;
    const { min, max } = prefs[key];
    const value = key === 'ageRange' ? `${min}-${max}` : `${formatHeight(min)}-${formatHeight(max)}`;
    out.push({ key, label: `${CHIP_LABEL[key] ?? PREFERENCE_LABEL[key]} ${value}`, required: strength === 'required' });
  }
  for (const key of MULTI_PREFERENCE_KEYS) {
    const strength = effectiveStrength(prefs[key]);
    if (strength === 'any') continue;
    out.push({ key, label: `${CHIP_LABEL[key] ?? PREFERENCE_LABEL[key]}: ${summarizeValues(key, prefs[key].values, 2)}`, required: strength === 'required' });
  }
  return out;
}

/** Manual discovery: the viewer's saved preferences, each with its own strength, applied to the same pool. */
export default function Explore() {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  const { viewer, areaId, candidates, loading, refreshing, error, refresh, reload, reportImpressions, adoptFilters } = useCandidates();
  useRefreshOnFocus(refresh);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const people = useMemo(() => (viewer ? rankForYou(viewer, candidates).map((c) => c.profile) : []), [viewer, candidates]);
  const filters = useMemo(() => (viewer ? activeFilters(viewer.preferences, viewer.maxDistanceMiles) : []), [viewer]);

  return (
    <Screen>
      <Header title="Explore" />
      {loading ? (
        <Loading />
      ) : error ? (
        <View style={styles.errorWrap}>
          <ErrorText message={error} />
          <Button title="Try again" variant="secondary" size="small" onPress={reload} />
        </View>
      ) : (
        <PeopleGrid
          people={people}
          refreshing={refreshing}
          onRefresh={refresh}
          onViewed={reportImpressions}
          ListHeaderComponent={
            <View style={styles.filters}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Filters"
                  onPress={() => setFiltersOpen(true)}
                  style={({ pressed }) => [styles.slidersChip, pressed && { opacity: 0.8 }]}
                >
                  <Icon name="sliders" size={16} color={colors.ivory} />
                </Pressable>
                {filters.map((f) => (
                  <TagChip key={f.key} label={f.label} selected={f.required} onPress={() => setFiltersOpen(true)} />
                ))}
              </ScrollView>
              <Text style={[text.caption, styles.summary]}>
                {people.length} {people.length === 1 ? 'person' : 'people'}
              </Text>
            </View>
          }
          ListEmptyComponent={<EmptyState title="No one matches every requirement." body="Relax a required filter to Preferred to see more people." actionTitle="Edit filters" onAction={() => setFiltersOpen(true)} />}
        />
      )}

      <FiltersSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} viewer={viewer} areaId={areaId} onApplied={adoptFilters} />
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  errorWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  filters: { marginTop: -spacing.sm, gap: spacing.sm, paddingBottom: spacing.xs },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  slidersChip: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  summary: { paddingHorizontal: spacing.lg },
});
