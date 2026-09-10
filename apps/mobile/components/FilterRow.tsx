import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PreferenceStrength } from '@peaches/core';
import { colors, spacing, text } from '@/constants/theme';
import { Icon } from './Icon';
import { PreferenceStrengthSelector } from './PreferenceStrengthSelector';

interface Props {
  label: string;
  summary: string;
  onPress?: () => void;
  strength?: PreferenceStrength;
  onStrengthChange?: (next: PreferenceStrength) => void;
  /** Replaces the summary line with a custom control (range steppers). */
  control?: React.ReactNode;
}

/** Two compact lines: label with its strength selector, then the current value. */
export function FilterRow({ label, summary, onPress, strength, onStrengthChange, control }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={[text.body, styles.label]} numberOfLines={1}>
          {label}
        </Text>
        {strength && onStrengthChange ? <PreferenceStrengthSelector value={strength} onChange={onStrengthChange} /> : null}
      </View>
      {control ? (
        <View style={styles.control}>{control}</View>
      ) : (
        <Pressable
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={onPress ? `${label}: ${summary}. Change` : undefined}
          onPress={onPress}
          disabled={!onPress}
          style={({ pressed }) => [styles.bottom, pressed && { opacity: 0.7 }]}
        >
          <Text style={[text.caption, styles.summary, summary !== 'Any' && { color: colors.textSecondary }]} numberOfLines={1}>
            {summary}
          </Text>
          {onPress ? <Icon name="chevron-right" size={16} color={colors.textFaint} /> : null}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  label: { flexShrink: 1 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32, gap: spacing.sm },
  summary: { flex: 1, fontSize: 13 },
  control: { paddingTop: 6, paddingBottom: 2 },
});
