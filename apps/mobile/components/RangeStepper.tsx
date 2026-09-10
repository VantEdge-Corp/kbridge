import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, text } from '@/constants/theme';
import { Icon } from './Icon';

interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  label: string;
}

function Stepper({ value, onChange, min, max, step = 1, format, label }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - step))} style={({ pressed }) => [styles.btn, pressed && styles.pressed]} hitSlop={6}>
        <Icon name="minus" size={14} color={colors.textSecondary} />
      </Pressable>
      <Text style={styles.value} accessibilityLabel={`${label} ${format(value)}`}>
        {format(value)}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + step))} style={({ pressed }) => [styles.btn, pressed && styles.pressed]} hitSlop={6}>
        <Icon name="plus" size={14} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

interface Props {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
  bounds: { min: number; max: number };
  step?: number;
  format: (v: number) => string;
}

/** Compact min/max steppers for age and height ranges. */
export function RangeStepper({ min, max, onChange, bounds, step, format }: Props) {
  return (
    <View style={styles.row}>
      <Stepper label="minimum" value={min} min={bounds.min} max={max} step={step} format={format} onChange={(v) => onChange(v, Math.max(v, max))} />
      <Text style={text.caption}>to</Text>
      <Stepper label="maximum" value={max} min={min} max={bounds.max} step={step} format={format} onChange={(v) => onChange(Math.min(min, v), v)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, height: 34 },
  btn: { width: 36, height: 32, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  value: { minWidth: 48, textAlign: 'center', color: colors.text, fontSize: 14, fontWeight: '500' },
});
