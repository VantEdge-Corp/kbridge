import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';

/** Separator insets measured from the container edge: text rows, rows with a 20px icon, rows with a 40px avatar. */
export const GROUP_INSET = {
  text: spacing.lg,
  icon: spacing.lg + 20 + spacing.md,
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
 * A grouped list in a shadcn Card: `card` ground, a 1px `border`, radius xl.
 * Rows carry no borders of their own; hairline separators are inset from the
 * leading icon or avatar, as on iOS.
 */
export function Group({ children, inset = GROUP_INSET.text, flush, style }: Props) {
  const styles = useStyles(makeStyles);
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

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    group: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      overflow: 'hidden',
    },
    margins: { marginHorizontal: spacing.lg },
    separator: { height: 1, backgroundColor: colors.border },
  });
