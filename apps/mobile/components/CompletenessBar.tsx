import { StyleSheet, Text, View } from 'react-native';
import { useStyles, useTheme, type Theme } from '@/lib/theme';

export function CompletenessBar({ percent }: { percent: number }) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  const p = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.wrap} accessibilityLabel={`Profile ${p} percent complete`}>
      <View style={styles.labels}>
        <Text style={text.label}>Profile completeness</Text>
        <Text style={[text.bodySmall, { color: colors.text, fontWeight: '500' }]}>{p}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${p}%` }]} />
      </View>
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  wrap: { gap: 8 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.ivory, borderRadius: 2 },
});
