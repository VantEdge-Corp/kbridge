import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme';

interface Props {
  title: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tighter top spacing for the first section on a screen. */
  first?: boolean;
}

/** A section heading over a group of rows, as the web's Section. 28px above (12 for the first), 10 below. */
export function SectionHeader({ title, right, style, first }: Props) {
  const { text } = useTheme();
  return (
    <View style={[styles.row, first && styles.first, style]}>
      <Text style={text.section} accessibilityRole="header">
        {title}
      </Text>
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
    paddingTop: 28,
    paddingBottom: 10,
  },
  first: { paddingTop: spacing.md },
});
