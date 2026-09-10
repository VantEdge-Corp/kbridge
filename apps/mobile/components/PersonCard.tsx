import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nameAge, type PublicProfile } from '@peaches/core';
import { cardHeightFor } from '@/constants/layout';
import { card, colors, text } from '@/constants/theme';
import { MonogramPortrait } from './MonogramPortrait';
import { VerificationBadge } from './VerificationBadge';

interface Props {
  profile: PublicProfile;
  width: number;
}

/** 3:4 portrait, name and age in Georgia, a small verification mark, one metadata line. No like controls. */
export const PersonCard = memo(function PersonCard({ profile, width }: Props) {
  const router = useRouter();
  const height = cardHeightFor(width);
  const photo = profile.photos[0] ?? null;
  const meta = [profile.occupation || profile.employmentDisplay || '', profile.displayArea].filter(Boolean).join(' · ');
  const verified = profile.publicVerificationBadges.length > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${nameAge(profile.firstName, profile.age)}${verified ? ', verified' : ''}. ${meta}`}
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: profile.id } })}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={[styles.image, { width, height }]} contentFit="cover" transition={150} recyclingKey={profile.id} />
      ) : (
        <MonogramPortrait firstName={profile.firstName} width={width} height={height} radius={card.imageRadius} />
      )}
      <View style={styles.nameRow}>
        <Text style={[text.name, styles.name]} numberOfLines={1}>
          {nameAge(profile.firstName, profile.age)}
        </Text>
        {verified ? <VerificationBadge /> : null}
      </View>
      <Text style={text.caption} numberOfLines={1}>
        {meta}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  image: { borderRadius: card.imageRadius, backgroundColor: colors.surfaceElevated },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  name: { flexShrink: 1 },
  pressed: { opacity: 0.85 },
});
