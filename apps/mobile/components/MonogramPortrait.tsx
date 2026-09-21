import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { initials } from '@peaches/core';
import { fonts } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';

interface Props {
  firstName: string;
  width: number;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Placeholder portrait for members without photos: a warm dark gradient with the initial in Georgia and a hairline ring. */
export function MonogramPortrait({ firstName, width, height, radius = 16, style }: Props) {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
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

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.imageRing,
  },
  initial: { fontFamily: fonts.display, color: colors.ivory, opacity: 0.9 },
});
