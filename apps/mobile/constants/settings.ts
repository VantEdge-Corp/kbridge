import type { IconName } from '@/components/Icon';

/** The Settings list, in order, with the web's labels and icons (apps/web/src/routes/Settings.tsx). */
export const SETTINGS_SECTIONS = [
  { key: 'account', label: 'Account', icon: 'user' },
  { key: 'appearance', label: 'Appearance', icon: 'sun-moon' },
  { key: 'privacy', label: 'Privacy', icon: 'eye-off' },
  { key: 'discovery', label: 'Discovery Preferences', icon: 'sliders-horizontal' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'verification', label: 'Verification', icon: 'shield-check' },
  { key: 'blocked', label: 'Blocked Users', icon: 'user-x' },
  { key: 'safety', label: 'Safety', icon: 'shield' },
  { key: 'data', label: 'Data & Account', icon: 'database' },
] as const satisfies ReadonlyArray<{ key: string; label: string; icon: IconName }>;

export type SettingsSectionKey = (typeof SETTINGS_SECTIONS)[number]['key'];
