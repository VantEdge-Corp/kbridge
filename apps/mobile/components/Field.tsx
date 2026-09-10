import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius, spacing, text } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * 48px input on `surface` with a 1px border and radius md. Sentence-case label
 * above, helper or error below. Focus adds a `borderStrong` border and a 2px
 * ivory ring at 8% through the outer wrapper.
 */
export function Field({ label, error, helper, containerStyle, style, multiline, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.ring, focused && styles.ringFocused]}>
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.ivory}
          keyboardAppearance="dark"
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

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...text.label },
  ring: { borderRadius: radius.md + 2, padding: 2, margin: -2, backgroundColor: 'transparent' },
  ringFocused: { backgroundColor: colors.focusRing },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  multiline: { minHeight: 112, textAlignVertical: 'top' },
  focused: { borderColor: colors.borderStrong },
  errored: { borderColor: colors.danger },
  error: { fontSize: 13, lineHeight: 18, color: colors.danger },
  helper: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
});
