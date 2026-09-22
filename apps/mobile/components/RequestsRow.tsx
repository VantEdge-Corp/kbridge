import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IntroductionRequest, PublicProfile } from '@peaches/core';
import { avatar, iconSizes, radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

const FACES = 3;
const OVERLAP = 8;
const RING = 2;

/** "Maya wants to meet you" for one person, "3 people want to meet you" for more; the faces show who. */
function requestsHeadline(newest: PublicProfile, count: number): string {
  return count === 1 ? `${newest.firstName} wants to meet you` : `${count} people want to meet you`;
}

/**
 * Home's way to pending introduction requests: up to three of the newest faces
 * and one short line, opening Inbox > Requests. Renders nothing when there are none.
 */
export function RequestsRow({ requests, onPress }: { requests: readonly IntroductionRequest[]; onPress: () => void }) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  const people = requests.map((r) => r.counterpart);
  const [newest] = people;
  if (!newest) return null;
  const headline = requestsHeadline(newest, people.length);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={headline}
      accessibilityHint="Opens your introduction requests"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.faces}>
        {people.slice(0, FACES).map((p, i) => (
          <View key={p.id} style={[styles.face, i > 0 && styles.overlap, { zIndex: FACES - i }]}>
            <Avatar uri={p.photos[0] ?? null} firstName={p.firstName} size={avatar.small} />
          </View>
        ))}
      </View>
      {/* A long first name may take a second line; push-out keeps "you" from sitting there alone. */}
      <Text style={[text.body, styles.headline]} numberOfLines={2} lineBreakStrategyIOS="push-out">
        {headline}
      </Text>
      <Icon name="chevron-right" size={iconSizes.sm} color={colors.textMuted} />
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: {
      // 16 above; the card below brings its own 16, the gap Home keeps under the tabs without this row.
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      minHeight: 52,
      paddingLeft: spacing.sm,
      paddingRight: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
    },
    pressed: { opacity: 0.8 },
    faces: { flexDirection: 'row' },
    /** A ring in the row's own color separates overlapping faces. */
    face: { borderRadius: avatar.small / 2 + RING, borderWidth: RING, borderColor: colors.surface },
    overlap: { marginLeft: -OVERLAP },
    headline: { flex: 1, fontWeight: '500' },
  });
