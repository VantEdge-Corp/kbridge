import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { alpha, radius } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * shadcn/ui's Input with its Field: a label, a 44px input on the input
 * border (filled faintly in dark), then the helper or the error. Focus
 * turns the border to `ring` inside a 3px `ring/50` halo, and an error
 * draws the border and halo in `destructive`, as on the web.
 */
export function Field({ label, error, helper, containerStyle, style, multiline, onFocus, onBlur, ...rest }: Props) {
  const styles = useStyles(makeStyles);
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.halo, error ? styles.haloError : focused && styles.haloFocused]}>
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          cursorColor={colors.foreground}
          keyboardAppearance={isDark ? 'dark' : 'light'}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.multiline, focused && styles.focused, !!error && styles.errored, style]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const HALO = 3;

const makeStyles = ({ colors, text, isDark }: Theme) =>
  StyleSheet.create({
    wrap: { gap: 8 },
    label: text.label,
    // A ring around the input, never a fill: the input itself is transparent in light.
    halo: { borderRadius: radius.md + HALO, borderWidth: HALO, borderColor: 'transparent', margin: -HALO },
    haloFocused: { borderColor: colors.focusRing },
    haloError: { borderColor: alpha(colors.destructive, isDark ? 0.4 : 0.2) },
    input: {
      minHeight: 44,
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.input,
      borderRadius: radius.md,
      color: colors.foreground,
      fontSize: 16,
      lineHeight: 20,
    },
    multiline: { minHeight: 104, textAlignVertical: 'top' },
    focused: { borderColor: colors.ring },
    errored: { borderColor: colors.destructive },
    error: { fontSize: 13, lineHeight: 18, color: colors.destructive },
    helper: { fontSize: 13, lineHeight: 18, color: colors.mutedForeground },
  });
