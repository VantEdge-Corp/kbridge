import { Platform, StyleSheet } from 'react-native';
import { avatar, card, colors, iconSizes, radius, spacing, strokeWidth, touch, typography } from '@peaches/core';

/**
 * Georgia is used intentionally: wordmark, screen titles, profile names, and
 * selected editorial headings. Everything else is the platform sans-serif
 * (fontFamily undefined lets iOS and Android use their system font).
 */
export const fonts = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) as string,
  sans: undefined as string | undefined,
};

export const text = StyleSheet.create({
  wordmark: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.wordmark,
    letterSpacing: typography.letterSpacing.wordmark,
    color: colors.ivory,
  },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.text },
  heading: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.text },
  name: { fontFamily: fonts.display, fontSize: 17, lineHeight: 22, color: colors.text },
  subheading: { fontSize: 18, lineHeight: 24, color: colors.text, fontWeight: '500' },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  bodySecondary: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  bodySmall: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  caption: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  micro: { fontSize: 11, lineHeight: 14, color: colors.textMuted },
  eyebrow: { fontSize: 11, lineHeight: 14, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  label: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, fontWeight: '500' },
});

export { avatar, card, colors, iconSizes, radius, spacing, strokeWidth, touch, typography };
