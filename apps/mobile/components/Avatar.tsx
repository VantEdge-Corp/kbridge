import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { initials } from '@peaches/core';
import { fonts } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';

/** shadcn/ui's Avatar: a circle with the photo, or the first initial in the display serif on `muted`, and a hairline ring. */
export function Avatar({ uri, firstName, size }: { uri: string | null | undefined; firstName: string; size: number }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" transition={120} accessibilityLabel={`${firstName}'s photo`} />
      ) : (
        <Text style={[styles.initial, { fontSize: Math.round(size * 0.52), lineHeight: Math.round(size * 0.66) }]} accessibilityLabel={`${firstName}'s initial`}>
          {initials(firstName) || '·'}
        </Text>
      )}
      <View pointerEvents="none" style={[styles.ring, { borderRadius: size / 2 }]} />
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    circle: { overflow: 'hidden', backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
    initial: { fontFamily: fonts.displayStrong, color: colors.mutedForeground },
    ring: { ...StyleSheet.absoluteFill, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.imageRing },
  });
