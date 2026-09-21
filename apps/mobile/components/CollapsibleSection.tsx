import React, { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Icon } from './Icon';

interface Props {
  title: string;
  count: number;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}

/** A section header with a count pill and a chevron that folds its content away. */
export function CollapsibleSection({ title, count, children, initiallyOpen = true }: Props) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.create(150, 'easeInEaseOut', 'opacity'));
    setOpen((v) => !v);
  };
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${count}`}
        onPress={toggle}
        style={({ pressed }) => [styles.head, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.title}>{title}</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{count > 99 ? '99+' : count}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>
      {open ? children : null}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md, minHeight: 44 },
  title: { fontSize: 15, fontWeight: '500', color: colors.text },
  pill: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 11, fontWeight: '600', color: colors.text },
});
