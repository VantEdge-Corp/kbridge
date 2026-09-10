import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

/** Separator insets measured from the container edge: text rows, rows with an 18px icon, rows with a 40px avatar. */
export const GROUP_INSET = {
  text: spacing.lg,
  icon: spacing.lg + 18 + spacing.md,
  avatar: spacing.lg + 40 + spacing.md,
} as const;

interface Props {
  children: React.ReactNode;
  /** Left inset of the row separators. */
  inset?: number;
  /** Drops the 16px side margins when the parent already pads the content. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Grouped list container: one `surface` panel with a 1px border and radius lg.
 * Rows inside carry no borders of their own; thin separators are inset from
 * the leading avatar or icon.
 */
export function Group({ children, inset = GROUP_INSET.text, flush, style }: Props) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, !flush && styles.margins, style]}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <View style={[styles.separator, { marginLeft: inset }]} /> : null}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  margins: { marginHorizontal: spacing.lg },
  separator: { height: 1, backgroundColor: colors.border },
});
