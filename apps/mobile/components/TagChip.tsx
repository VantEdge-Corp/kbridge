import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Icon } from './Icon';

export type ChipVariant = 'secondary' | 'outline' | 'default';

interface Props {
  label: string;
  /** shadcn Badge variants: `secondary` for tags, `outline` for preferred filters, `default` for required ones. */
  variant?: ChipVariant;
  onPress?: () => void;
  onRemove?: () => void;
}

export function TagChip({ label, variant = 'secondary', onPress, onRemove }: Props) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const textColor = variant === 'default' ? colors.primaryForeground : variant === 'outline' ? colors.foreground : colors.secondaryForeground;
  const body = (
    <View style={[styles.chip, styles[variant]]}>
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${label}`}>
          <Icon name="x" size={12} color={textColor} />
        </Pressable>
      ) : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.8 }}>
      {body}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
  return <View style={styles.row}>{children}</View>;
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      height: 30,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    secondary: { backgroundColor: colors.secondary },
    outline: { borderColor: colors.border },
    default: { backgroundColor: colors.primary },
    label: { fontSize: 13 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  });
