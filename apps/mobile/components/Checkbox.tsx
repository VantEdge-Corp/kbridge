import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, touch } from '@/constants/theme';
import { Icon } from './Icon';

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Label content; inline links inside it stay tappable because only the box toggles. */
  children: React.ReactNode;
  accessibilityLabel: string;
}

export function Checkbox({ checked, onChange, children, accessibilityLabel }: Props) {
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
        <View style={[styles.box, checked && styles.checked]}>{checked ? <Icon name="check" size={14} color={colors.onIvory} /> : null}</View>
      </Pressable>
      <View style={styles.label}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  target: { width: touch.minTarget - 12, height: touch.minTarget - 12, alignItems: 'center', justifyContent: 'center', marginTop: -6 },
  box: { width: 20, height: 20, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.ivory, borderColor: colors.ivory },
  label: { flex: 1 },
});
