import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Scheme = 'light' | 'dark';
/** What the member chose in Settings > Appearance. `system` follows the device. */
export type ThemePreference = 'system' | Scheme;

export const THEME_PREFERENCES: ReadonlyArray<{ value: ThemePreference; label: string; description: string }> = [
  { value: 'system', label: 'System', description: 'Follows your device setting' },
  { value: 'light', label: 'Light', description: 'White with near-black text' },
  { value: 'dark', label: 'Dark', description: 'Near-black with white text' },
];

/** Same key as the inline script in index.html, which applies the class before the first paint. */
const STORAGE_KEY = 'peaches.theme';
/** `--background` in each scheme, for the browser chrome. */
const THEME_COLOR: Record<Scheme, string> = { light: '#ffffff', dark: '#0a0a0a' };

interface ThemeValue {
  preference: ThemePreference;
  scheme: Scheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Resolves System / Light / Dark to a scheme and keeps `<html class="dark">` and the browser chrome in step. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [systemDark, setSystemDark] = useState(() => systemQuery().matches);

  useEffect(() => {
    const query = systemQuery();
    const onChange = () => setSystemDark(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const scheme: Scheme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', scheme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[scheme]);
  }, [scheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Private mode: the choice lasts for this visit. */
    }
  }, []);

  const value = useMemo<ThemeValue>(() => ({ preference, scheme, setPreference }), [preference, scheme, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
