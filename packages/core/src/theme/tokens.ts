/**
 * Peaches design tokens: the shadcn/ui Neutral theme
 * (https://ui.shadcn.com/colors) in light and dark, with shadcn's semantic
 * names. The web reads the same palette as oklch CSS variables in
 * apps/web/src/index.css; the phone app reads these hex equivalents (React
 * Native cannot parse oklch). Keep the two in step.
 *
 * `verified` is the one Peaches addition: the color of verification marks.
 */
export const lightColors = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#ffffff',
  cardForeground: '#0a0a0a',
  popover: '#ffffff',
  popoverForeground: '#0a0a0a',
  primary: '#171717',
  primaryForeground: '#fafafa',
  secondary: '#f5f5f5',
  secondaryForeground: '#171717',
  muted: '#f5f5f5',
  mutedForeground: '#737373',
  accent: '#f5f5f5',
  accentForeground: '#171717',
  destructive: '#e7000b',
  border: '#e5e5e5',
  input: '#e5e5e5',
  ring: '#a1a1a1',
  verified: '#179765',
} as const;

export type ColorTokens = { readonly [K in keyof typeof lightColors]: string };

export const darkColors: ColorTokens = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  card: '#171717',
  cardForeground: '#fafafa',
  popover: '#171717',
  popoverForeground: '#fafafa',
  primary: '#e5e5e5',
  primaryForeground: '#171717',
  secondary: '#262626',
  secondaryForeground: '#fafafa',
  muted: '#262626',
  mutedForeground: '#a1a1a1',
  accent: '#262626',
  accentForeground: '#fafafa',
  destructive: '#ff6467',
  border: 'rgba(255, 255, 255, 0.1)',
  input: 'rgba(255, 255, 255, 0.15)',
  ring: '#737373',
  verified: '#5ecd97',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** shadcn's scale from `--radius: 0.625rem`: sm 60%, md 80%, lg 100%, xl 140%, 2xl 180%. */
export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  xxl: 18,
  pill: 999,
} as const;

/**
 * The Tailwind type scale shadcn/ui is built on. Instrument Serif (regular and
 * italic) is the display face: the wordmark and monogram, page titles, names,
 * headlines, and bios. Every other piece of UI text is the sans: Geist on the
 * web, the platform font on phones.
 */
export const typography = {
  families: {
    display: 'Instrument Serif',
    sans: 'system',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    xxl: 32,
    xxxl: 36,
  },
  /** `tracking-tight`, in ems; multiply by the font size on phones. */
  tightTracking: -0.025,
  /** The PEACHES wordmark's letter spacing at its 22px phone size (0.2em). */
  wordmarkTracking: 4.4,
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
  },
} as const;

/** Lucide icons at stroke 2, the shadcn default. 16 inside controls, 20 standalone, 24 in the phone tab bar. */
export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  nav: 24,
} as const;

export const strokeWidth = 2;

export const card = {
  /** Portrait proportion for person cards: width 3, height 4. */
  aspectRatio: 3 / 4,
  columns: 2,
  gap: 12,
  pagePadding: 16,
  imageRadius: radius.xl,
} as const;

export const avatar = {
  inbox: 40,
  feed: 36,
  small: 28,
} as const;

export const touch = {
  minTarget: 44,
} as const;

export const tokens = { lightColors, darkColors, spacing, radius, typography, iconSizes, strokeWidth, card, avatar, touch } as const;
export type Tokens = typeof tokens;
