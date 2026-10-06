import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { initials } from '@peaches/core';
import { fonts } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';

interface Props {
  firstName: string;
  width: number;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Stands in for a member without photos: their initial in the italic display serif on `muted` with a hairline ring, as on the web. */
export function MonogramPortrait({ firstName, width, height, radius = 14, style }: Props) {
  const styles = useStyles(makeStyles);
  const fontSize = Math.round(Math.min(width, height) * 0.5);
  return (
    <View style={[styles.root, { width, height, borderRadius: radius }, style]} accessibilityLabel={`${firstName}'s portrait placeholder`}>
      {/* Italic letters overhang their advance (a J's hook, an A's foot); the padding keeps iOS from clipping them. */}
      <Text style={[styles.initial, { fontSize, lineHeight: Math.round(fontSize * 1.3), paddingHorizontal: Math.round(fontSize * 0.3) }]}>{initials(firstName) || '·'}</Text>
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: colors.muted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.imageRing,
    },
    initial: { fontFamily: fonts.displayItalic, color: colors.mutedForeground, opacity: 0.6 },
  });
