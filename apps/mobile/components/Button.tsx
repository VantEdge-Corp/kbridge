import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { alpha, radius, touch } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * shadcn/ui's Button at touch size: 44 tall (36 small, 48 large), radius md,
 * 15px medium. `default` is the one primary action on a screen; `outline`
 * and `secondary` sit beside it; `ghost` is text only; `destructive` is a
 * soft red. Pressed dims, disabled fades to half.
 */
export function Button({ title, onPress, variant = 'default', size = 'default', disabled, loading, icon, fullWidth, style, accessibilityLabel }: Props) {
  const { base, sizes, variants } = useStyles(makeStyles);
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const color = {
    default: colors.primaryForeground,
    outline: colors.foreground,
    secondary: colors.secondaryForeground,
    ghost: colors.foreground,
    destructive: colors.destructive,
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        base.button,
        sizes[size],
        variants[variant],
        fullWidth && base.full,
        pressed && !inactive && (variant === 'ghost' || variant === 'outline' ? base.pressedFill : base.pressed),
        inactive && base.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={base.content}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} color={color} /> : null}
          <Text style={[base.label, size === 'sm' && base.labelSmall, { color }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = ({ colors, isDark }: Theme) => ({
  base: StyleSheet.create({
    button: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
    full: { alignSelf: 'stretch' },
    pressed: { opacity: 0.85 },
    pressedFill: { backgroundColor: colors.accent },
    disabled: { opacity: 0.5 },
    content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    label: { fontSize: 15, fontWeight: '500' },
    labelSmall: { fontSize: 14 },
  }),
  sizes: StyleSheet.create({
    default: { minHeight: touch.minTarget, paddingHorizontal: 16 },
    sm: { minHeight: 36, paddingHorizontal: 12 },
    lg: { minHeight: 48, paddingHorizontal: 20 },
  }),
  variants: StyleSheet.create({
    default: { backgroundColor: colors.primary },
    outline: { backgroundColor: isDark ? colors.inputBackground : colors.background, borderColor: isDark ? colors.input : colors.border },
    secondary: { backgroundColor: colors.secondary },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: alpha(colors.destructive, isDark ? 0.2 : 0.1) },
  }),
});
