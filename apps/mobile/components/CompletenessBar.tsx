import { StyleSheet, Text, View } from 'react-native';
import { useStyles, useTheme, type Theme } from '@/lib/theme';

/** shadcn/ui's Progress with a label and the value. */
export function CompletenessBar({ percent }: { percent: number }) {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  const p = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel="Profile completeness" accessibilityValue={{ min: 0, max: 100, now: p }}>
      <View style={styles.labels}>
        <Text style={text.label}>Profile completeness</Text>
        <Text style={[text.bodySmall, styles.value]}>{p}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${p}%` }]} />
      </View>
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    wrap: { gap: 10 },
    labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    value: { fontVariant: ['tabular-nums'] },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.muted, overflow: 'hidden' },
    fill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  });
