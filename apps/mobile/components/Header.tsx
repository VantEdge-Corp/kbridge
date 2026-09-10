import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, iconSizes, spacing, text, touch } from '@/constants/theme';
import { Icon, type IconName } from './Icon';
import { Wordmark } from './Wordmark';

interface Props {
  title?: string;
  wordmark?: boolean;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Small line under the title. */
  subtitle?: string;
}

/** Back arrow, Georgia 28 title, one small trailing action. */
export function Header({ title, wordmark, back, onBack, right, subtitle }: Props) {
  const router = useRouter();
  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <View style={styles.row}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} hitSlop={8} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Icon name="arrow-left" size={iconSizes.lg} color={colors.ivory} />
        </Pressable>
      ) : null}
      <View style={styles.titleWrap}>
        {wordmark ? (
          <Wordmark />
        ) : title ? (
          <Text style={text.title} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={[text.caption, { marginTop: 2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

/** A 40px icon-only trailing action for headers. */
export function HeaderIconButton({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Icon name={name} size={iconSizes.md} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: { width: touch.minTarget, height: touch.minTarget, alignItems: 'flex-start', justifyContent: 'center', marginLeft: -spacing.xs },
  titleWrap: { flex: 1, justifyContent: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  pressed: { opacity: 0.7 },
});
