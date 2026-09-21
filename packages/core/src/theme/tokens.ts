/**
 * Peaches design tokens. Platform-agnostic values; the web maps them to CSS
 * variables and Tailwind, the mobile app to StyleSheet values.
 *
 * Two palettes share one set of semantic names. Dark is the brand default:
 * 90-95% dark surfaces (near-black, charcoal, graphite, a very dark warm
 * gray) with warm ivory reserved for text, selected controls, small buttons,
 * and important information. Light keeps the same restraint on warm
 * off-white: white cards, near-black ink where dark uses ivory.
 *
 * `ivory` / `onIvory` name the primary control color and the text on it:
 * warm ivory with near-black text in dark mode, near-black ink with warm
 * off-white text in light mode.
 */
export const darkColors = {
  /** Page background: near-black. */
  canvas: '#0b0b0c',
  /** Default surface: charcoal. */
  surface: '#131315',
  /** Elevated surface: graphite. */
  surfaceElevated: '#1b1b1e',
  /** Very dark warm gray, used for warm sections and the wordmark ground. */
  surfaceWarm: '#171512',
  /** Subtle borders and separators. */
  border: '#26262a',
  borderStrong: '#36363b',
  /** Warm ivory. Primary text and selected controls. */
  ivory: '#f1ece2',
  text: '#f1ece2',
  textSecondary: '#b7b1a6',
  textMuted: '#7f7a71',
  textFaint: '#55524c',
  /** Text on an ivory control. */
  onIvory: '#0f0f10',
  /** Verification: calm, understated, professional. */
  verified: '#9db8a5',
  /** Attention, muted. Never bright red. */
  danger: '#c9908a',
  /** Pressed/hover states. */
  surfaceHover: '#1f1f23',
  overlay: 'rgba(11, 11, 12, 0.72)',
  /** 2px focus ring around inputs and controls. */
  focusRing: 'rgba(241, 236, 226, 0.08)',
  /** Hairline inner ring on photos and portraits. */
  imageRing: 'rgba(241, 236, 226, 0.06)',
  /** Hover state of a primary (ivory) button. */
  ivoryHover: '#e6e0d4',
  /** Placeholder portrait ground tones (warm, desaturated). */
  portraitA: '#2a2622',
  portraitB: '#3a3129',
} as const;

export type ColorTokens = { readonly [K in keyof typeof darkColors]: string };

/** Light palette: the same semantic tokens on warm off-white. */
export const lightColors: ColorTokens = {
  canvas: '#f7f5f1',
  surface: '#ffffff',
  surfaceElevated: '#f3f0ea',
  surfaceWarm: '#f1ede5',
  border: '#e7e3dc',
  borderStrong: '#d6d1c8',
  ivory: '#161513',
  text: '#161513',
  textSecondary: '#5f5a52',
  textMuted: '#8b857b',
  textFaint: '#b8b2a8',
  onIvory: '#f7f5f1',
  verified: '#4c7c5c',
  danger: '#b2544a',
  surfaceHover: '#efece6',
  overlay: 'rgba(22, 21, 19, 0.4)',
  focusRing: 'rgba(22, 21, 19, 0.08)',
  imageRing: 'rgba(22, 21, 19, 0.06)',
  ivoryHover: '#2b2925',
  portraitA: '#d9d1c5',
  portraitB: '#ebe4d8',
};

/** The brand default palette. The web reads this; the mobile app picks per scheme. */
export const colors = darkColors;

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

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Georgia is used intentionally and selectively: the PEACHES wordmark, major
 * screen titles, important profile names, and selected editorial headings.
 * Everything else is the platform's modern sans-serif.
 */
export const typography = {
  families: {
    /** Serif for wordmark, titles, profile names. */
    display: 'Georgia',
    /** Modern system sans for navigation, metadata, buttons, filters, body. */
    sans: 'system',
  },
  sizes: {
    wordmark: 20,
    title: 28,
    heading: 22,
    subheading: 18,
    name: 17,
    body: 15,
    bodySmall: 13,
    caption: 12,
    micro: 11,
  },
  lineHeights: {
    title: 34,
    heading: 28,
    subheading: 24,
    body: 22,
    bodySmall: 18,
    caption: 16,
  },
  letterSpacing: {
    wordmark: 4,
    eyebrow: 1.2,
    normal: 0,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
  },
} as const;

/** Icons are small, thin, monochrome, and outline-based. */
export const iconSizes = {
  sm: 18,
  md: 20,
  lg: 22,
  nav: 20,
} as const;

export const strokeWidth = 1.5;

export const card = {
  /** Portrait proportion for person cards: width 3, height 4. */
  aspectRatio: 3 / 4,
  columns: 2,
  gap: 12,
  pagePadding: 16,
  imageRadius: 16,
} as const;

export const avatar = {
  inbox: 40,
  feed: 36,
  small: 28,
} as const;

export const touch = {
  minTarget: 44,
} as const;

export const tokens = { colors, spacing, radius, typography, iconSizes, strokeWidth, card, avatar, touch } as const;
export type Tokens = typeof tokens;
