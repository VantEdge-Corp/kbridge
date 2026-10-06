import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, touch } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Icon } from './Icon';

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Label content; inline links inside it stay tappable because only the box toggles. */
  children: React.ReactNode;
  accessibilityLabel: string;
}

/** shadcn/ui's Checkbox: an `input` bordered square that fills with `primary` and a check when on. */
export function Checkbox({ checked, onChange, children, accessibilityLabel }: Props) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={accessibilityLabel}
        onPress={() => onChange(!checked)}
        hitSlop={10}
        style={styles.target}
      >
        <View style={[styles.box, checked && styles.checked]}>{checked ? <Icon name="check" size={14} color={colors.primaryForeground} /> : null}</View>
      </Pressable>
      <View style={styles.label}>{children}</View>
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    target: { width: touch.minTarget - 12, height: touch.minTarget - 12, alignItems: 'center', justifyContent: 'center', marginTop: -6, marginLeft: -6 },
    box: { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: colors.ring, backgroundColor: colors.inputBackground, alignItems: 'center', justifyContent: 'center' },
    checked: { backgroundColor: colors.primary, borderColor: colors.primary },
    label: { flex: 1 },
  });
