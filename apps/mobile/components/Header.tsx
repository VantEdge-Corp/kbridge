import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, iconSizes, spacing, text, touch } from '@/constants/theme';
import { Icon } from './Icon';
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
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} hitSlop={8} style={styles.back}>
          <Icon name="arrow-left" size={iconSizes.lg} color={colors.ivory} />
        </Pressable>
      ) : null}
      <View style={styles.titleWrap}>
        {wordmark ? <Wordmark /> : title ? <Text style={text.heading} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text style={[text.caption, { marginTop: 2 }]} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: { width: touch.minTarget, height: touch.minTarget, alignItems: 'flex-start', justifyContent: 'center', marginLeft: -spacing.xs },
  titleWrap: { flex: 1, justifyContent: 'center' },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
