import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { Icon } from './Icon';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}

export function TagChip({ label, selected, onPress, onRemove }: Props) {
  const body = (
    <View style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${label}`}>
          <Icon name="x" size={12} color={selected ? colors.onIvory : colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!selected }} style={({ pressed }) => pressed && { opacity: 0.8 }}>
      {body}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: { backgroundColor: colors.ivory, borderColor: colors.ivory },
  label: { fontSize: 12, color: colors.textSecondary },
  labelSelected: { color: colors.onIvory, fontWeight: '500' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
