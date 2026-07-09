// ─────────────────────────────────────────────────────────────────────────────
// ui.js — kbridge's editorial primitives for native: mono uppercase labels,
// serif display type, hairline rules, underline fields, gradient portraits.
// The native counterpart of the web app's Label/Rule/Btn/TextField/Portrait.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, ActivityIndicator,
  RefreshControl, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme.js';

export function Screen({ children, scroll = false, refreshing = false, onRefresh, edges = ['top'], style }) {
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ padding: spacing(3), paddingBottom: spacing(6) }, style]}
      refreshControl={onRefresh ? (
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
      ) : undefined}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding: spacing(3) }, style]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      {body}
    </SafeAreaView>
  );
}

export function Label({ children, style }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function Rule({ style }) {
  return <View style={[styles.rule, style]} />;
}

export function ScreenHeader({ label, title, right }) {
  return (
    <View style={{ marginBottom: spacing(3) }}>
      <View style={styles.headerRow}>
        <Label>{label}</Label>
        {right}
      </View>
      {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
      <Rule style={{ marginTop: spacing(2) }} />
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', disabled = false, style }) {
  const variantStyles = {
    primary: { box: { backgroundColor: colors.accent }, text: { color: colors.bg } },
    ghost: { box: { borderWidth: 1, borderColor: colors.line }, text: { color: colors.text } },
    outline: { box: { borderWidth: 1, borderColor: colors.accent }, text: { color: colors.accent } },
    danger: { box: { borderWidth: 1, borderColor: `${colors.dangerDim}99` }, text: { color: colors.danger } },
  };
  const v = variantStyles[variant] || variantStyles.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, v.box, disabled && { opacity: 0.4 }, pressed && !disabled && { opacity: 0.75 }, style]}
    >
      <Text style={[styles.buttonText, v.text]}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label, value, onChangeText, placeholder, secureTextEntry,
  autoCapitalize = 'none', keyboardType = 'default',
  multiline = false, maxLength, error, hint, style,
}) {
  return (
    <View style={[{ marginBottom: spacing(3) }, style]}>
      {label ? <Label style={{ marginBottom: spacing(1) }}>{label}</Label> : null}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
      {(error || (multiline && maxLength)) ? (
        <View style={styles.fieldFooter}>
          <Text style={styles.fieldError}>{error || ''}</Text>
          {multiline && maxLength ? (
            <Text style={styles.fieldCount}>{(value || '').length}/{maxLength}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function BackBar({ onBack, right }) {
  return (
    <View style={styles.backBar}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backLink}>
        <Feather name="arrow-left" size={14} color={colors.muted} />
        <Text style={styles.label}>Back</Text>
      </Pressable>
      {right}
    </View>
  );
}

// Clickwrap consent row. Only the box toggles, so inline <Text onPress> links
// inside `children` (e.g. Terms / Privacy) open without also toggling.
export function Checkbox({ checked, onChange, children, error }) {
  return (
    <View style={{ marginBottom: spacing(1.5) }}>
      <View style={styles.checkboxRow}>
        <Pressable
          onPress={() => onChange(!checked)}
          hitSlop={8}
          style={[styles.checkboxBox, checked && styles.checkboxBoxOn]}
        >
          {checked ? <Feather name="check" size={13} color={colors.bg} /> : null}
        </Pressable>
        <Text style={styles.checkboxLabel}>{children}</Text>
      </View>
      {error ? <Text style={styles.checkboxError}>{error}</Text> : null}
    </View>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function Empty({ title, body, children }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(4) }}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {children}
    </View>
  );
}

export function Badge({ children, tone = 'muted', style }) {
  const color = tone === 'accent' ? colors.accent : colors.muted;
  return (
    <View style={[styles.badge, { borderColor: `${color}66` }, style]}>
      <Text style={[styles.badgeText, { color }]}>{children}</Text>
    </View>
  );
}

// The portrait: a member's gradient + initial, identical hash → gradient as
// the web. width + aspectRatio (3:4 default) instead of fixed heights.
export function Portrait({ profile, width = 96, ratio = 3 / 4, fontSize, style, children }) {
  const p = profile || {};
  const gradient = p.gradient || ['#1e2a3a', '#2a4055', '#4a6d8a'];
  return (
    <LinearGradient
      colors={gradient}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ width, aspectRatio: ratio, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}
    >
      <Text
        style={{
          fontFamily: fonts.display,
          fontStyle: 'italic',
          color: 'rgba(232,224,208,0.4)',
          fontSize: fontSize ?? Math.round(width * 0.5),
        }}
      >
        {p.initials || '?'}
      </Text>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
    marginTop: spacing(1),
  },
  button: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  input: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing(1),
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomWidth: 1,
    padding: spacing(1.5),
  },
  fieldHint: {
    fontFamily: fonts.mono,
    fontSize: 9,
    lineHeight: 15,
    letterSpacing: 0.5,
    color: colors.faint,
    marginBottom: spacing(1),
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing(0.75),
  },
  fieldError: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.danger,
  },
  fieldCount: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.faint,
    marginLeft: spacing(1),
  },
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(2),
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(1.5),
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: 21,
    color: '#a89d87',
  },
  checkboxLink: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  checkboxError: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.danger,
    marginTop: spacing(0.5),
    marginLeft: spacing(1.5) + 22,
  },
  error: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.danger,
    marginBottom: spacing(2),
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 18,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing(1.5),
    letterSpacing: 0.5,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: spacing(1),
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
