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
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - step))} style={styles.btn} hitSlop={6}>
        <Icon name="minus" size={14} color={colors.textSecondary} />
      </Pressable>
      <Text style={[text.bodySmall, styles.value]} accessibilityLabel={`${label} ${format(value)}`}>
        {format(value)}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + step))} style={styles.btn} hitSlop={6}>
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
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, height: 32 },
  btn: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 44, textAlign: 'center', color: colors.text },
});
