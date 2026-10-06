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
  /** Long-press: the member menu, as right-click on the web. */
  onLongPress?: () => void;
  /** Extra content under the row (an expanded note, action buttons). */
  children?: React.ReactNode;
  emphasize?: boolean;
  /** 40 for compact lists, 48 for conversations. */
  avatarSize?: number;
}

/** A row in a grouped list, as shadcn's Item: avatar, name, one preview line, time, unread count. The avatar opens the profile; the row opens the item. */
export function InboxRow({ profile, subtitle, time, unread, onPress, onAvatarPress, onLongPress, children, emphasize, avatarSize = avatar.inbox }: Props) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={onAvatarPress} accessibilityRole="button" accessibilityLabel={`Open ${profile.firstName}'s profile`} hitSlop={6}>
          <Avatar uri={profile.photos[0] ?? null} firstName={profile.firstName} size={avatarSize} />
        </Pressable>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={350}
          accessibilityRole="button"
          accessibilityHint={onLongPress ? 'Long press for more options' : undefined}
          style={({ pressed }) => [styles.body, { minHeight: avatarSize }, pressed && styles.pressed]}
        >
          <View style={styles.titleRow}>
            <Text style={[text.body, styles.name, (emphasize || !!unread) && styles.nameStrong]} numberOfLines={1}>
              {profile.firstName}
            </Text>
            {profile.publicVerificationBadges.length > 0 ? <VerificationBadge size={14} /> : null}
            <View style={{ flex: 1 }} />
            {time ? <Text style={text.caption}>{time}</Text> : null}
          </View>
          <View style={styles.subRow}>
            <Text style={[text.bodySmall, styles.subtitle, (emphasize || !!unread) && { color: colors.foreground }]} numberOfLines={1}>
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

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    body: { flex: 1, justifyContent: 'center', gap: 2 },
    pressed: { opacity: 0.7 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    name: { fontWeight: '500', flexShrink: 1 },
    nameStrong: { fontWeight: '600' },
    subRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    subtitle: { flex: 1 },
    pill: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    pillText: { fontSize: 11, fontWeight: '600', color: colors.primaryForeground },
  });
