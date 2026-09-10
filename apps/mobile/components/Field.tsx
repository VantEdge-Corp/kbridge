import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, radius, spacing, text } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string | null;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Field({ label, error, helper, containerStyle, style, multiline, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
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
      {error ? <Text style={styles.error}>{error}</Text> : helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...text.eyebrow },
  input: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 15,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  focused: { borderColor: colors.borderStrong },
  errored: { borderColor: colors.danger },
  error: { ...text.caption, color: colors.danger },
  helper: { ...text.caption },
});
