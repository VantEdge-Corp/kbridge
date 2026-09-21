import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, StyleSheet, View, useColorScheme } from 'react-native';
import { darkColors, lightColors, type ColorTokens } from '@peaches/core';
import { makeText, type TextStyles } from '@/constants/theme';

export type Scheme = 'light' | 'dark';
/** What the member chose in Settings > Appearance. `system` follows the device. */
export type ThemePreference = 'system' | Scheme;

export interface Theme {
  colors: ColorTokens;
  text: TextStyles;
  scheme: Scheme;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const THEME_PREFERENCES: ReadonlyArray<{ value: ThemePreference; label: string; description: string }> = [
  { value: 'system', label: 'System', description: 'Follows the device setting' },
  { value: 'light', label: 'Light', description: 'Warm off-white' },
  { value: 'dark', label: 'Dark', description: 'Near-black, the Peaches default' },
];

const STORAGE_KEY = 'peaches.theme';
const PALETTES: Record<Scheme, { colors: ColorTokens; text: TextStyles }> = {
  dark: { colors: darkColors, text: makeText(darkColors) },
  light: { colors: lightColors, text: makeText(lightColors) },
};

const ThemeContext = createContext<Theme | null>(null);

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

/**
 * Resolves the active palette from the saved preference and the device
 * scheme, and mirrors an explicit choice into `Appearance` so native pieces
 * (alerts, keyboards, sheets) follow it too. Children render once the saved
 * preference is known, so the app never flashes the wrong palette.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (mounted) setPreferenceState(isPreference(saved) ? saved : 'system');
      })
      .catch(() => {
        if (mounted) setPreferenceState('system');
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (preference) Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const scheme: Scheme = preference && preference !== 'system' ? preference : system === 'light' ? 'light' : 'dark';
  const value = useMemo<Theme>(
    () => ({ ...PALETTES[scheme], scheme, isDark: scheme === 'dark', preference: preference ?? 'system', setPreference }),
    [scheme, preference, setPreference],
  );

  if (!preference) return <View style={[StyleSheet.absoluteFill, { backgroundColor: PALETTES[scheme].colors.canvas }]} />;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

/** Memoizes a StyleSheet factory against the active theme. Declare the factory at module level. */
export function useStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
