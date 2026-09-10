import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { Icon } from './Icon';

/** Calm, understated trust mark. Only rendered for `verified` dimensions. */
export function VerificationBadge({ label, size = 14 }: { label?: string; size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel={label ? `${label} verified` : 'Verified'}>
      <Icon name="check-circle" size={size} color={colors.verified} />
      {label ? <Text style={[styles.label, { fontSize: size - 2 }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { color: colors.verified, fontWeight: '500' },
});
