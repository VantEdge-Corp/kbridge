import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Preferences, Viewer } from '@peaches/core';
import { spacing } from '@/constants/theme';
import type { AppliedFilters } from '@/hooks/useCandidates';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { useStyles, type Theme } from '@/lib/theme';
import { Button } from './Button';
import { ErrorText } from './ErrorText';
import { Header } from './Header';
import { Loading } from './Loading';
import { PreferenceEditor } from './PreferenceEditor';

interface Props {
  visible: boolean;
  onClose: () => void;
  viewer: Viewer | null;
  areaId: string | null;
  onApplied: (filters: AppliedFilters) => void;
}

/**
 * The filter sheet on Home and Explore. Filters are the member's saved
 * preferences, so applying them here changes both screens and Me > Discovery
 * preferences at once.
 */
export function FiltersSheet({ visible, onClose, viewer, areaId, onApplied }: Props) {
  const styles = useStyles(makeStyles);
  const { userId, refreshProfile } = useMember();
  const [draft, setDraft] = useState<Preferences | null>(null);
  const [draftArea, setDraftArea] = useState<string | null>(null);
  const [draftDistance, setDraftDistance] = useState(25);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // While closed the draft follows what is saved, so every opening starts from it and Cancel discards
  // edits. A sheet opened before the viewer loaded takes it as soon as it arrives.
  const started = draft !== null;
  useEffect(() => {
    if (!viewer || (visible && started)) return;
    setDraft(viewer.preferences);
    setDraftArea(areaId);
    setDraftDistance(viewer.maxDistanceMiles);
    setError(null);
  }, [viewer, areaId, visible, started]);

  const apply = async () => {
    if (!viewer || !draft) return;
    setSaving(true);
    setError(null);
    try {
      const areaChanged = draftArea !== areaId;
      await api.profiles.savePreferences(userId, draft);
      if (areaChanged || draftDistance !== viewer.maxDistanceMiles) {
        await api.profiles.updatePrivate(userId, { areaId: draftArea, maxDistanceMiles: draftDistance });
        await refreshProfile();
      }
      onApplied({ viewer: { ...viewer, preferences: draft, maxDistanceMiles: draftDistance }, areaId: draftArea, areaChanged });
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.modal}>
        <Header title="Filters" right={<Button title="Apply" size="small" onPress={apply} loading={saving} disabled={!draft} />} back onBack={onClose} />
        {draft ? (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <PreferenceEditor
              prefs={draft}
              onChange={setDraft}
              areaId={draftArea}
              maxDistanceMiles={draftDistance}
              onAreaChange={setDraftArea}
              onDistanceChange={setDraftDistance}
            />
            <ErrorText message={error} />
          </ScrollView>
        ) : (
          <Loading />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  modal: { flex: 1, backgroundColor: colors.canvas },
  body: { paddingBottom: spacing.xxxl },
});
