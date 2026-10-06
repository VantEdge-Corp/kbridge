import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { useStyles, useTheme, type Theme } from '@/lib/theme';

/** The verification seal (Lucide badge-check in `verified`). Only rendered for verified dimensions. */
export function VerificationBadge({ label, size = 16 }: { label?: string; size?: number }) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.row} accessibilityLabel={label ? `${label} verified` : 'Verified'}>
      <Icon name="badge-check" size={size} color={colors.verified} />
      {label ? <Text style={[styles.label, { fontSize: Math.max(12, size - 3) }]}>{label}</Text> : null}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    label: { color: colors.foreground, fontWeight: '500' },
  });
