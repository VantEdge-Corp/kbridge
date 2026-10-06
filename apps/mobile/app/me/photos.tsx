import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LIMITS } from '@peaches/core';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { pickImage } from '@/lib/images';

const COLUMNS = 3;
const GAP = 8;

export default function Photos() {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  const { userId, profile, refreshProfile } = useMember();
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const tile = Math.floor((width - spacing.lg * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  if (!profile) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back title="Photos" />
        <Loading />
      </Screen>
    );
  }

  const photos = profile.photoPaths.map((path, i) => ({ path, url: profile.photos[i] ?? '' }));

  const add = async () => {
    try {
      const upload = await pickImage({ aspect: [3, 4] });
      if (!upload) return;
      setBusy(true);
      await api.profiles.addPhoto(userId, profile.photoPaths, upload);
      await refreshProfile();
    } catch (e) {
      Alert.alert('Could not add photo', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const actions = (path: string, index: number) => {
    Alert.alert('Photo', undefined, [
      ...(index > 0
        ? [
            {
              text: 'Make main photo',
              onPress: async () => {
                try {
                  const next = [path, ...profile.photoPaths.filter((p) => p !== path)];
                  await api.profiles.reorderPhotos(userId, next);
                  await refreshProfile();
                } catch (e) {
                  Alert.alert('Could not reorder', errorMessage(e));
                }
              },
            },
          ]
        : []),
      {
        text: 'Remove',
        style: 'destructive' as const,
        onPress: async () => {
          try {
            await api.profiles.removePhoto(userId, profile.photoPaths, path);
            await refreshProfile();
          } catch (e) {
            Alert.alert('Could not remove', errorMessage(e));
          }
        },
      },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title="Photos" right={photos.length < LIMITS.photos ? <Button title="Add" size="sm" icon="plus" onPress={add} loading={busy} /> : undefined} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={text.caption}>
          Up to {LIMITS.photos} photos, shown in this order. The first is your main portrait. Tap a photo to reorder or remove it.
        </Text>
        <View style={styles.grid}>
          {photos.map((p, i) => (
            <Pressable key={p.path} onPress={() => actions(p.path, i)} accessibilityRole="button" accessibilityLabel={`Photo ${i + 1} options`} style={{ width: tile }}>
              <Image source={{ uri: p.url }} style={{ width: tile, height: Math.round(tile / 0.75), borderRadius: radius.xl, backgroundColor: colors.muted, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.imageRing }} contentFit="cover" />
              {i === 0 ? (
                <View style={styles.main}>
                  <Text style={styles.mainText}>Main</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
          {photos.length < LIMITS.photos ? (
            <Pressable onPress={add} accessibilityRole="button" accessibilityLabel="Add photo" style={[styles.add, { width: tile, height: Math.round(tile / 0.75) }]}>
              <Icon name="plus" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  main: { position: 'absolute', left: 6, top: 6, backgroundColor: colors.primary, paddingHorizontal: 8, height: 20, justifyContent: 'center', borderRadius: radius.pill },
  mainText: { fontSize: 11, color: colors.primaryForeground, fontWeight: '600' },
  add: { borderRadius: radius.xl, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.ring, alignItems: 'center', justifyContent: 'center', gap: 6 },
});
