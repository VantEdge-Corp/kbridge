import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing, text } from '@/constants/theme';

interface Props {
  title: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tighter top spacing for the first section on a screen. */
  first?: boolean;
}

/** Uppercase eyebrow for section headers only. 32px above (12px for the first), 12px below. */
export function SectionHeader({ title, right, style, first }: Props) {
  return (
    <View style={[styles.row, first && styles.first, style]}>
      <Text style={text.eyebrow}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  first: { paddingTop: spacing.md },
});
