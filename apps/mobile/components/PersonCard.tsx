import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nameAge, type PublicProfile } from '@peaches/core';
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
}

/** 3:4 portrait with a hairline ring, name and age in Georgia, a small verification mark, one metadata line. No like controls. */
export const PersonCard = memo(function PersonCard({ profile, width, caption, captionLines = 1, onPress }: Props) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  const router = useRouter();
  const height = cardHeightFor(width);
  const photo = profile.photos[0] ?? null;
  const meta = caption ?? [profile.occupation || profile.employmentDisplay || '', profile.displayArea].filter(Boolean).join(' · ');
  const verified = profile.publicVerificationBadges.length > 0;
  const open = onPress ?? (() => router.push({ pathname: '/profile/[id]', params: { id: profile.id } }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nameAge(profile.firstName, profile.age)}${verified ? ', verified' : ''}. ${meta}`}
      onPress={open}
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
      <Text style={[text.caption, caption != null && styles.captionText]} numberOfLines={captionLines}>
        {meta}
      </Text>
    </Pressable>
  );
});

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  frame: {
    borderRadius: card.imageRadius,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.imageRing,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  name: { flexShrink: 1 },
  captionText: { color: colors.textSecondary, lineHeight: 17 },
  pressed: { opacity: 0.85 },
});
