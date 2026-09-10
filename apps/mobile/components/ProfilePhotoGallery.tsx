import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LIMITS } from '@peaches/core';
import { colors, radius, spacing, text } from '@/constants/theme';
import { Icon } from './Icon';

interface Props {
  photos: Array<{ url: string; path: string }>;
  onAdd: () => void;
  onRemove: (path: string) => void;
  busy?: boolean;
}

const TILE_W = 96;
const TILE_H = 128;

/** Horizontal strip of up to six 3:4 tiles with a dashed add tile. */
export function ProfilePhotoGallery({ photos, onAdd, onRemove, busy }: Props) {
  const canAdd = photos.length < LIMITS.photos;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {photos.map((p, i) => (
          <View key={p.path} style={styles.tile}>
            <Image source={{ uri: p.url }} style={styles.image} contentFit="cover" transition={120} accessibilityLabel={`Photo ${i + 1}`} />
            {i === 0 ? (
              <View style={styles.primary}>
                <Text style={styles.primaryText}>Main</Text>
              </View>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`} onPress={() => onRemove(p.path)} style={styles.remove} hitSlop={6}>
              <Icon name="x" size={12} color={colors.onIvory} />
            </Pressable>
          </View>
        ))}
        {canAdd ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Add photo" onPress={busy ? undefined : onAdd} style={({ pressed }) => [styles.add, pressed && { opacity: 0.7 }]}>
            {busy ? <ActivityIndicator color={colors.textSecondary} /> : <Icon name="plus" size={18} color={colors.textSecondary} />}
            {!busy ? <Text style={text.micro}>Add</Text> : null}
          </Pressable>
        ) : null}
      </ScrollView>
      <Text style={[text.caption, styles.count]}>
        {photos.length} of {LIMITS.photos} photos{photos.length === 0 ? ' · profiles with photos are opened far more often' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  tile: { width: TILE_W, height: TILE_H, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.imageRing },
  image: { width: TILE_W, height: TILE_H },
  primary: { position: 'absolute', left: 6, bottom: 6, backgroundColor: colors.overlay, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  primaryText: { fontSize: 10, color: colors.ivory, fontWeight: '500' },
  remove: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' },
  add: { width: TILE_W, height: TILE_H, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.surface },
  count: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
