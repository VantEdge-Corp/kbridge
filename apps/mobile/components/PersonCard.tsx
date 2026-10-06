import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nameAge, profileMetaLine, type PublicProfile } from '@peaches/core';
import { cardHeightFor } from '@/constants/layout';
import { card } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { MonogramPortrait } from './MonogramPortrait';
import { VerificationBadge } from './VerificationBadge';

interface Props {
  profile: PublicProfile;
  width: number;
  /** Replaces the metadata line, e.g. the excerpt of an introduction note. */
  caption?: string;
  captionLines?: number;
  /** Defaults to opening the profile. */
  onPress?: () => void;
  /** Opens the member menu, as right-click does on the web. */
  onLongPress?: () => void;
}

/** 3:4 portrait with a hairline ring, name and age, the verification seal, one metadata line. No like controls. */
export const PersonCard = memo(function PersonCard({ profile, width, caption, captionLines = 1, onPress, onLongPress }: Props) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  const router = useRouter();
  const height = cardHeightFor(width);
  const photo = profile.photos[0] ?? null;
  const meta = caption ?? profileMetaLine(profile);
  const verified = profile.publicVerificationBadges.length > 0;
  const open = onPress ?? (() => router.push({ pathname: '/profile/[id]', params: { id: profile.id } }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nameAge(profile.firstName, profile.age)}${verified ? ', verified' : ''}. ${meta}`}
      accessibilityHint={onLongPress ? 'Long press for more options' : undefined}
      onPress={open}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      {photo ? (
        <View style={[styles.frame, { width, height }]}>
          <Image source={{ uri: photo }} style={{ width, height }} contentFit="cover" transition={150} recyclingKey={profile.id} />
        </View>
      ) : (
        <MonogramPortrait firstName={profile.firstName} width={width} height={height} radius={card.imageRadius} />
      )}
      <View style={styles.nameRow}>
        <Text style={[text.name, styles.name]} numberOfLines={1}>
          {nameAge(profile.firstName, profile.age)}
        </Text>
        {verified ? <VerificationBadge /> : null}
      </View>
      <Text style={[styles.meta, caption != null && styles.captionText]} numberOfLines={captionLines}>
        {meta}
      </Text>
    </Pressable>
  );
});

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    frame: {
      borderRadius: card.imageRadius,
      overflow: 'hidden',
      backgroundColor: colors.muted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.imageRing,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
    name: { flexShrink: 1 },
    meta: { marginTop: 1, fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
    captionText: { color: colors.foreground, opacity: 0.8 },
    pressed: { opacity: 0.85 },
  });
