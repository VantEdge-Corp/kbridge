import { Platform, StyleSheet } from 'react-native';
import { avatar, card, iconSizes, radius, spacing, strokeWidth, touch, typography, type ColorTokens } from '@peaches/core';

/**
 * Georgia is the brand mark only: the PEACHES wordmark. Every piece of UI
 * text is the platform sans (fontFamily undefined lets iOS and Android use
 * their system font), as shadcn/ui's type is on the web.
 */
export const fonts = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) as string,
  sans: undefined as string | undefined,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
};

/**
 * The shadcn/ui Neutral tokens plus the few values the web derives with
 * opacity modifiers (`bg-input/30`, `ring-ring/50`, `ring-foreground/10`),
 * which React Native needs as plain colors.
 */
export interface Palette extends ColorTokens {
  /** Dims the screen behind sheets. */
  overlay: string;
  /** Fill of inputs and outline buttons: transparent in light, `input` at 30% in dark. */
  inputBackground: string;
  /** The 3px halo around a focused control: `ring` at 50%. */
  focusRing: string;
  /** Hairline inner ring on photos and portraits: `foreground` at 10%. */
  imageRing: string;
}

export function makePalette(tokens: ColorTokens, scheme: 'light' | 'dark'): Palette {
  const dark = scheme === 'dark';
  return {
    ...tokens,
    overlay: dark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)',
    inputBackground: dark ? 'rgba(255, 255, 255, 0.045)' : 'transparent',
    focusRing: dark ? 'rgba(115, 115, 115, 0.5)' : 'rgba(161, 161, 161, 0.5)',
    imageRing: dark ? 'rgba(250, 250, 250, 0.1)' : 'rgba(10, 10, 10, 0.1)',
  };
}

/** `#rrggbb` at an opacity, the way Tailwind's `/10` modifiers read on the web. */
export function alpha(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const tight = (size: number) => size * typography.tightTracking;

/** The text styles for one palette. Components read them as `text` from `useTheme()`. */
export function makeText(colors: Palette) {
  return StyleSheet.create({
    wordmark: {
      fontFamily: fonts.display,
      fontSize: 20,
      letterSpacing: typography.wordmarkTracking,
      color: colors.foreground,
    },
    /** Screen titles and the name on a profile. */
    title: { fontSize: 28, lineHeight: 34, fontWeight: '600', letterSpacing: tight(28), color: colors.foreground },
    /** Sheet titles, empty-state titles. */
    heading: { fontSize: 20, lineHeight: 28, fontWeight: '600', letterSpacing: tight(20), color: colors.foreground },
    /** Section headings above a group of rows. */
    section: { fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: tight(16), color: colors.foreground },
    /** Names on cards. */
    name: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: colors.foreground },
    subheading: { fontSize: 18, lineHeight: 26, fontWeight: '600', color: colors.foreground },
    body: { fontSize: 15, lineHeight: 22, color: colors.foreground },
    bodySecondary: { fontSize: 15, lineHeight: 22, color: colors.mutedForeground },
    bodySmall: { fontSize: 14, lineHeight: 20, color: colors.mutedForeground },
    caption: { fontSize: 12, lineHeight: 16, color: colors.mutedForeground },
    micro: { fontSize: 11, lineHeight: 14, color: colors.mutedForeground },
    /** Small label inside a card ("About Priya", "Your introduction"). */
    eyebrow: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: colors.mutedForeground },
    /** Field labels, as shadcn's Label. */
    label: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: colors.foreground },
  });
}

export type TextStyles = ReturnType<typeof makeText>;

export { avatar, card, iconSizes, radius, spacing, strokeWidth, touch, typography };
export type { ColorTokens };
