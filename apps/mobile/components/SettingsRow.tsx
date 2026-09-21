import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { Icon, type IconName } from './Icon';

interface Props {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: IconName;
  destructive?: boolean;
  chevron?: boolean;
  /** Custom right-hand control (a Switch). */
  right?: React.ReactNode;
  description?: string;
}

/** A row for grouped lists. No borders of its own; the Group draws the separators. */
export function SettingsRow({ label, value, onPress, icon, destructive, chevron = true, right, description }: Props) {
  const { colors, text } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && { backgroundColor: colors.surfaceHover }]}
    >
      {icon ? <Icon name={icon} size={18} color={destructive ? colors.danger : colors.textSecondary} /> : null}
      <View style={styles.textWrap}>
        <Text style={[text.body, destructive && { color: colors.danger }]}>{label}</Text>
        {description ? <Text style={[text.caption, { marginTop: 2 }]}>{description}</Text> : null}
      </View>
      {value ? (
        <Text style={[text.bodySmall, styles.value]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {onPress && chevron && !right ? <Icon name="chevron-right" size={16} color={colors.textFaint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  textWrap: { flex: 1 },
  value: { maxWidth: '45%', textAlign: 'right' },
});
