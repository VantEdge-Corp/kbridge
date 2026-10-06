import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PREFERENCE_STRENGTHS, type PreferenceStrength } from '@peaches/core';
import { alpha, radius } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';

const LABEL: Record<PreferenceStrength, string> = { required: 'Required', preferred: 'Preferred', any: 'Any' };

/** Required · Preferred · Any as a small segmented control, the web's look. One per preference row. */
export function PreferenceStrengthSelector({ value, onChange, label }: { value: PreferenceStrength; onChange: (next: PreferenceStrength) => void; label?: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={label ? `${label} strength` : undefined}>
      {PREFERENCE_STRENGTHS.map((s) => {
        const on = s === value;
        return (
          <Pressable
            key={s}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, checked: on }}
            accessibilityLabel={LABEL[s]}
            onPress={() => onChange(s)}
            hitSlop={{ top: 8, bottom: 8 }}
            style={[styles.segment, on && styles.on]}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{LABEL[s]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    track: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: radius.lg, padding: 3, height: 32 },
    segment: { paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent', justifyContent: 'center' },
    on: isDark
      ? { backgroundColor: colors.inputBackground, borderColor: colors.input }
      : { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
    label: { fontSize: 12, fontWeight: '500', color: isDark ? colors.mutedForeground : alpha(colors.foreground, 0.6) },
    labelOn: { color: colors.foreground },
  });
