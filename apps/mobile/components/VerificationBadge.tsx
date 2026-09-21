import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { useStyles, useTheme, type Theme } from '@/lib/theme';

/** Calm, understated trust mark. Only rendered for `verified` dimensions. */
export function VerificationBadge({ label, size = 14 }: { label?: string; size?: number }) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityLabel={label ? `${label} verified` : 'Verified'}>
      <Icon name="check-circle" size={size} color={colors.verified} />
      {label ? <Text style={[styles.label, { fontSize: size - 2 }]}>{label}</Text> : null}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { color: colors.verified, fontWeight: '500' },
});
