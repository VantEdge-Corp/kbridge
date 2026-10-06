import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { iconSizes, radius, spacing, touch } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { Icon, type IconName } from './Icon';
import { Wordmark } from './Wordmark';

interface Props {
  title?: string;
  wordmark?: boolean;
  back?: boolean;
  /** A modal's leading control: an X labelled Close in place of the back arrow. */
  close?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Small line under the title. */
  subtitle?: string;
  /** Content centered over the bar, e.g. a name that fades in as the page scrolls. Not interactive. */
  center?: React.ReactNode;
  /** Custom content for the title slot, e.g. who a conversation is with. Replaces `title`. */
  children?: React.ReactNode;
}

/** Back arrow (or a modal's X), a 28/34 semibold title, one small trailing action. */
export function Header({ title, wordmark, back, close, onBack, right, subtitle, center, children }: Props) {
  const { colors, text } = useTheme();
  const router = useRouter();
  const goBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <View style={styles.row}>
      {center ? (
        <View style={styles.center} pointerEvents="none">
          {center}
        </View>
      ) : null}
      {back || close ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={close ? 'Close' : 'Back'}
          onPress={goBack}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Icon name={close ? 'x' : 'arrow-left'} size={iconSizes.lg} color={colors.foreground} />
        </Pressable>
      ) : null}
      <View style={styles.titleWrap}>
        {children ? (
          children
        ) : wordmark ? (
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

/** A 40px icon-only trailing action, like shadcn's ghost icon button. */
export function HeaderIconButton({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: colors.accent }]}
    >
      <Icon name={name} size={iconSizes.md} color={colors.foreground} />
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
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 72 },
  back: { width: touch.minTarget, height: touch.minTarget, alignItems: 'flex-start', justifyContent: 'center', marginLeft: -spacing.xs },
  titleWrap: { flex: 1, justifyContent: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  pressed: { opacity: 0.7 },
});
