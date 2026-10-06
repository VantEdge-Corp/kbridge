import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
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
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - step))}
        style={({ pressed }) => [styles.btn, pressed && { backgroundColor: colors.accent }, value <= min && styles.off]}
        hitSlop={6}
      >
        <Icon name="minus" size={14} color={colors.foreground} />
      </Pressable>
      <Text style={styles.value} accessibilityLabel={`${label} ${format(value)}`}>
        {format(value)}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + step))}
        style={({ pressed }) => [styles.btn, pressed && { backgroundColor: colors.accent }, value >= max && styles.off]}
        hitSlop={6}
      >
        <Icon name="plus" size={14} color={colors.foreground} />
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

/** Min and max steppers for age and height ranges, each an outline button group. */
export function RangeStepper({ min, max, onChange, bounds, step, format }: Props) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  return (
    <View style={styles.row}>
      <Stepper label="minimum" value={min} min={bounds.min} max={max} step={step} format={format} onChange={(v) => onChange(v, Math.max(v, max))} />
      <Text style={text.bodySmall}>to</Text>
      <Stepper label="maximum" value={max} min={min} max={bounds.max} step={step} format={format} onChange={(v) => onChange(Math.min(min, v), v)} />
    </View>
  );
}

const makeStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? colors.inputBackground : colors.background,
      borderWidth: 1,
      borderColor: isDark ? colors.input : colors.border,
      borderRadius: radius.md,
      height: 36,
      overflow: 'hidden',
    },
    btn: { width: 36, height: 34, alignItems: 'center', justifyContent: 'center' },
    off: { opacity: 0.4 },
    value: { minWidth: 52, textAlign: 'center', color: colors.foreground, fontSize: 14, fontWeight: '500', fontVariant: ['tabular-nums'] },
  });
