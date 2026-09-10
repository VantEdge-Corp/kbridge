import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { initials } from '@peaches/core';
import { colors, fonts } from '@/constants/theme';

interface Props {
  firstName: string;
  width: number;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Placeholder portrait for members without photos: a warm dark gradient with the initial in Georgia. */
export function MonogramPortrait({ firstName, width, height, radius = 12, style }: Props) {
  const fontSize = Math.round(Math.min(width, height) * 0.36);
  return (
    <LinearGradient
      colors={[colors.portraitB, colors.portraitA]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.root, { width, height, borderRadius: radius }, style]}
      accessibilityLabel={`${firstName}'s portrait placeholder`}
    >
      <Text style={[styles.initial, { fontSize, lineHeight: Math.round(fontSize * 1.1) }]}>{initials(firstName) || '·'}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  initial: { fontFamily: fonts.display, color: colors.ivory, opacity: 0.9 },
});
