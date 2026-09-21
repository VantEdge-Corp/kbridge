import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MULTI_PREFERENCE_KEYS, PREFERENCE_LABEL, RANGE_PREFERENCE_KEYS, effectiveStrength, formatHeight, rankForYou, type Preferences } from '@peaches/core';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorText } from '@/components/ErrorText';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Loading } from '@/components/Loading';
import { PeopleGrid } from '@/components/PeopleGrid';
import { PreferenceEditor, summarizeValues } from '@/components/PreferenceEditor';
import { Screen } from '@/components/Screen';
import { TagChip } from '@/components/TagChip';
import { radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { useCandidates } from '@/hooks/useCandidates';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

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
  const { userId } = useMember();
  const { viewer, areaId, candidates, loading, refreshing, error, refresh, reload, reportImpressions, setViewer, setAreaId } = useCandidates();
  useRefreshOnFocus(refresh);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Preferences | null>(null);
  const [draftArea, setDraftArea] = useState<string | null>(null);
  const [draftDistance, setDraftDistance] = useState(25);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (viewer && !open) {
      setDraft(viewer.preferences);
      setDraftDistance(viewer.maxDistanceMiles);
    }
  }, [viewer, open]);
  useEffect(() => {
    if (!open) setDraftArea(areaId);
  }, [areaId, open]);

  const people = useMemo(() => (viewer ? rankForYou(viewer, candidates).map((c) => c.profile) : []), [viewer, candidates]);
  const filters = useMemo(() => (viewer ? activeFilters(viewer.preferences, viewer.maxDistanceMiles) : []), [viewer]);

  const apply = useCallback(async () => {
    if (!viewer || !draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      const areaChanged = draftArea !== areaId;
      const distanceChanged = draftDistance !== viewer.maxDistanceMiles;
      await api.profiles.savePreferences(userId, draft);
      if (areaChanged || distanceChanged) {
        await api.profiles.updatePrivate(userId, { areaId: draftArea, maxDistanceMiles: draftDistance });
      }
      setViewer({ ...viewer, preferences: draft, maxDistanceMiles: draftDistance });
      setAreaId(draftArea);
      setOpen(false);
      if (areaChanged) void reload();
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [viewer, draft, draftArea, draftDistance, areaId, userId, setViewer, setAreaId, reload]);

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
                  onPress={() => setOpen(true)}
                  style={({ pressed }) => [styles.slidersChip, pressed && { opacity: 0.8 }]}
                >
                  <Icon name="sliders" size={16} color={colors.ivory} />
                </Pressable>
                {filters.map((f) => (
                  <TagChip key={f.key} label={f.label} selected={f.required} onPress={() => setOpen(true)} />
                ))}
              </ScrollView>
              <Text style={[text.caption, styles.summary]}>
                {people.length} {people.length === 1 ? 'person' : 'people'}
              </Text>
            </View>
          }
          ListEmptyComponent={<EmptyState title="No one matches every requirement." body="Relax a required filter to Preferred to see more people." actionTitle="Edit filters" onAction={() => setOpen(true)} />}
        />
      )}

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.modal}>
          <Header title="Filters" right={<Button title="Apply" size="small" onPress={apply} loading={saving} />} back onBack={() => setOpen(false)} />
          {draft ? (
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <PreferenceEditor
                prefs={draft}
                onChange={setDraft}
                areaId={draftArea}
                maxDistanceMiles={draftDistance}
                onAreaChange={setDraftArea}
                onDistanceChange={setDraftDistance}
              />
              <ErrorText message={saveError} />
            </ScrollView>
          ) : (
            <Loading />
          )}
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  errorWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  filters: { marginTop: -spacing.sm, gap: spacing.sm, paddingBottom: spacing.xs },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  slidersChip: { width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  summary: { paddingHorizontal: spacing.lg },
  modal: { flex: 1, backgroundColor: colors.canvas },
  modalBody: { paddingBottom: spacing.xxxl },
});
