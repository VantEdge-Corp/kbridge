import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing, touch } from '@/constants/theme';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'default' | 'small';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * 44px, radius md, 15px medium. Primary is ivory (one per screen); secondary
 * is a 1px outline; ghost is text only; danger is a muted outline. Pressed
 * state is 0.8 opacity.
 */
export function Button({ title, onPress, variant = 'primary', size = 'default', disabled, loading, icon, fullWidth, style, accessibilityLabel }: Props) {
  const inactive = disabled || loading;
  const color = variant === 'primary' ? colors.onIvory : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.text : colors.ivory;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'small' ? styles.small : styles.regular,
        styles[variant],
        fullWidth && styles.full,
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={size === 'small' ? 16 : 18} color={color} /> : null}
          <Text style={[styles.label, size === 'small' && styles.labelSmall, { color }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  regular: { minHeight: touch.minTarget },
  small: { minHeight: 36, paddingHorizontal: 14, borderRadius: radius.sm + 2 },
  primary: { backgroundColor: colors.ivory },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: spacing.md },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  full: { alignSelf: 'stretch' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 15, fontWeight: '500' },
  labelSmall: { fontSize: 13 },
});
