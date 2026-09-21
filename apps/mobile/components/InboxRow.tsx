import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PublicProfile } from '@peaches/core';
import { avatar, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Avatar } from './Avatar';
import { VerificationBadge } from './VerificationBadge';

interface Props {
  profile: PublicProfile;
  subtitle: string;
  time?: string;
  unread?: number;
  onPress: () => void;
  onAvatarPress: () => void;
  /** Extra content under the row (an expanded note, action buttons). */
  children?: React.ReactNode;
  emphasize?: boolean;
  /** 40 for compact lists, 48 for conversations. */
  avatarSize?: number;
}

/** Compact row with a circular avatar for grouped lists. Tapping the avatar or name opens the profile; the row body opens the item. */
export function InboxRow({ profile, subtitle, time, unread, onPress, onAvatarPress, children, emphasize, avatarSize = avatar.inbox }: Props) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={onAvatarPress} accessibilityRole="button" accessibilityLabel={`Open ${profile.firstName}'s profile`} hitSlop={6}>
          <Avatar uri={profile.photos[0] ?? null} firstName={profile.firstName} size={avatarSize} />
        </Pressable>
        <Pressable onPress={onPress} accessibilityRole="button" style={[styles.body, { minHeight: avatarSize }]}>
          <View style={styles.titleRow}>
            <Pressable onPress={onAvatarPress} hitSlop={4} style={styles.nameWrap}>
              <Text style={[text.body, styles.name, emphasize && styles.nameStrong]} numberOfLines={1}>
                {profile.firstName}
              </Text>
            </Pressable>
            {profile.publicVerificationBadges.length > 0 ? <VerificationBadge size={13} /> : null}
            <View style={{ flex: 1 }} />
            {time ? <Text style={text.micro}>{time}</Text> : null}
          </View>
          <View style={styles.subRow}>
            <Text style={[text.bodySmall, styles.subtitle, emphasize && { color: colors.text }]} numberOfLines={1}>
              {subtitle}
            </Text>
            {unread ? (
              <View style={styles.pill} accessibilityLabel={`${unread} unread`}>
                <Text style={styles.pillText}>{unread}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, justifyContent: 'center', gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameWrap: { flexShrink: 1 },
  name: { fontWeight: '500' },
  nameStrong: { color: colors.ivory },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  subtitle: { flex: 1 },
  pill: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  pillText: { fontSize: 11, fontWeight: '600', color: colors.onIvory },
});
