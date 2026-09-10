import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { Preferences } from '@peaches/core';
import { Button } from '@/components/Button';
import { ErrorText } from '@/components/ErrorText';
import { Header } from '@/components/Header';
import { Loading } from '@/components/Loading';
import { PreferenceEditor } from '@/components/PreferenceEditor';
import { Screen } from '@/components/Screen';
import { spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

/** The same editor Explore uses; saved preferences drive Home and Explore alike. */
export default function PreferencesScreen() {
  const router = useRouter();
  const { userId, email, refreshProfile } = useMember();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [distance, setDistance] = useState(25);
  const [initial, setInitial] = useState<{ areaId: string | null; distance: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.profiles.getPreferences(userId), api.profiles.getPrivate(userId, email)])
      .then(([p, priv]) => {
        if (cancelled) return;
        setPrefs(p);
        setAreaId(priv.areaId);
        setDistance(priv.maxDistanceMiles);
        setInitial({ areaId: priv.areaId, distance: priv.maxDistanceMiles });
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, email]);

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    try {
      await api.profiles.savePreferences(userId, prefs);
      if (!initial || initial.areaId !== areaId || initial.distance !== distance) {
        await api.profiles.updatePrivate(userId, { areaId, maxDistanceMiles: distance });
        await refreshProfile();
      }
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title="Preferences" right={<Button title="Save" size="small" onPress={save} loading={saving} disabled={!prefs} />} />
      {prefs ? (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <PreferenceEditor prefs={prefs} onChange={setPrefs} areaId={areaId} maxDistanceMiles={distance} onAreaChange={setAreaId} onDistanceChange={setDistance} />
          <ErrorText message={error} />
        </ScrollView>
      ) : error ? (
        <ErrorText message={error} />
      ) : (
        <Loading />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: spacing.xxxl },
});
