import { Platform, StyleSheet } from 'react-native';
import { avatar, card, iconSizes, radius, spacing, strokeWidth, touch, typography, type ColorTokens } from '@peaches/core';

/**
 * Instrument Serif, regular and italic (loaded in app/_layout.tsx before the
 * splash screen hides), is the display face: the wordmark, screen titles,
 * names, headlines, and bios. Everything else is the platform sans
 * (fontFamily undefined), as Geist is on the web. The serif has no bold, so
 * a display style never sets fontWeight.
 */
export const fonts = {
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
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

/** A small-caps label, as the web's `kicker` utility: section labels and labels inside cards. */
const kicker = { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 1.8, textTransform: 'uppercase' } as const;

/** The text styles for one palette. Components read them as `text` from `useTheme()`. */
export function makeText(colors: Palette) {
  return StyleSheet.create({
    wordmark: {
      fontFamily: fonts.display,
      fontSize: 22,
      letterSpacing: typography.wordmarkTracking,
      color: colors.foreground,
    },
    /** The welcome headline. Pair with `displayItalic` for its emphasized word. */
    display: { fontFamily: fonts.display, fontSize: 52, lineHeight: 58, letterSpacing: -0.8, color: colors.foreground },
    displayItalic: { fontFamily: fonts.displayItalic },
    /** Screen titles and the name on a profile. */
    title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 42, letterSpacing: -0.2, color: colors.foreground },
    /** Sheet titles, empty-state titles, the name on Me. */
    heading: { fontFamily: fonts.display, fontSize: 27, lineHeight: 34, color: colors.foreground },
    /** Names on cards and in headers. */
    name: { fontFamily: fonts.display, fontSize: 21, lineHeight: 27, color: colors.foreground },
    /** A member's bio, read like a pull-quote. */
    quote: { fontFamily: fonts.display, fontSize: 22, lineHeight: 30, color: colors.foreground },
    /** Section labels above a group of rows. */
    section: { ...kicker, color: colors.mutedForeground },
    /** Small label inside a card ("About Priya", "Your introduction"). */
    eyebrow: { ...kicker, color: colors.mutedForeground },
    body: { fontSize: 15, lineHeight: 22, color: colors.foreground },
    bodySecondary: { fontSize: 15, lineHeight: 22, color: colors.mutedForeground },
    bodySmall: { fontSize: 14, lineHeight: 20, color: colors.mutedForeground },
    caption: { fontSize: 12, lineHeight: 16, color: colors.mutedForeground },
    micro: { fontSize: 11, lineHeight: 14, color: colors.mutedForeground },
    /** Field labels, as shadcn's Label. */
    label: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: colors.foreground },
  });
}

export type TextStyles = ReturnType<typeof makeText>;

export { avatar, card, iconSizes, radius, spacing, strokeWidth, touch, typography };
export type { ColorTokens };
