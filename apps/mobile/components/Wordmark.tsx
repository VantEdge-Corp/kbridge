import { Text, type StyleProp, type TextStyle } from 'react-native';
import { BRAND } from '@peaches/core';
import { useTheme } from '@/lib/theme';

export function Wordmark({ size = 20, style }: { size?: number; style?: StyleProp<TextStyle> }) {
  const { text } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[text.wordmark, { fontSize: size, letterSpacing: Math.max(3, size * 0.2) }, style]}
      maxFontSizeMultiplier={1.2}
    >
      {BRAND.wordmark}
    </Text>
  );
}
