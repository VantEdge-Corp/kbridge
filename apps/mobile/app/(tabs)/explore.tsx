import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MULTI_PREFERENCE_KEYS, RANGE_PREFERENCE_KEYS, effectiveStrength, rankForYou, type Preferences } from '@peaches/core';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorText } from '@/components/ErrorText';
import { Header } from '@/components/Header';
import { Loading } from '@/components/Loading';
import { PeopleGrid } from '@/components/PeopleGrid';
import { PreferenceEditor } from '@/components/PreferenceEditor';
import { Screen } from '@/components/Screen';
import { colors, spacing, text } from '@/constants/theme';
import { useCandidates } from '@/hooks/useCandidates';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

function countStrengths(prefs: Preferences): { required: number; preferred: number } {
  let required = 0;
  let preferred = 0;
  for (const key of [...RANGE_PREFERENCE_KEYS, ...MULTI_PREFERENCE_KEYS]) {
    const s = effectiveStrength(prefs[key]);
    if (s === 'required') required += 1;
    if (s === 'preferred') preferred += 1;
  }
  return { required, preferred };
}

/** Manual discovery: the viewer's saved preferences, each with its own strength, applied to the same pool. */
export default function Explore() {
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
  const counts = viewer ? countStrengths(viewer.preferences) : { required: 0, preferred: 0 };

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
      <Header title="Explore" right={<Button title="Filters" icon="sliders" variant="secondary" size="small" onPress={() => setOpen(true)} disabled={!viewer} />} />
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
            <Text style={[text.caption, styles.summary]}>
              {people.length} {people.length === 1 ? 'person' : 'people'} · {counts.required} required · {counts.preferred} preferred · within{' '}
              {viewer?.maxDistanceMiles ?? 25} miles
            </Text>
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

const styles = StyleSheet.create({
  errorWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  summary: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  modal: { flex: 1, backgroundColor: colors.canvas },
  modalBody: { paddingBottom: spacing.xxxl },
});
