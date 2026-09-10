import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, text } from '@/constants/theme';

export function CompletenessBar({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.wrap} accessibilityLabel={`Profile ${p} percent complete`}>
      <View style={styles.labels}>
        <Text style={text.caption}>Profile completeness</Text>
        <Text style={[text.caption, { color: colors.textSecondary }]}>{p}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${p}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, gap: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: colors.ivory },
});
