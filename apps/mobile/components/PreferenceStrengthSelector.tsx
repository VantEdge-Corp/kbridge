import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PREFERENCE_STRENGTHS, type PreferenceStrength } from '@peaches/core';
import { radius } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';

const LABEL: Record<PreferenceStrength, string> = { required: 'Required', preferred: 'Preferred', any: 'Any' };

/** One compact segmented control per preference row. Never three large buttons. */
export function PreferenceStrengthSelector({ value, onChange }: { value: PreferenceStrength; onChange: (next: PreferenceStrength) => void }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {PREFERENCE_STRENGTHS.map((s) => {
        const on = s === value;
        return (
          <Pressable
            key={s}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
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

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, padding: 2, height: 30 },
  segment: { paddingHorizontal: 9, borderRadius: radius.pill, justifyContent: 'center' },
  on: { backgroundColor: colors.ivory },
  label: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  labelOn: { color: colors.onIvory },
});
