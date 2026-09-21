import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { MonogramPortrait } from './MonogramPortrait';
import { useStyles, type Theme } from '@/lib/theme';

/** Always circular. Inbox rows 40, feed 36, small 28. */
export function Avatar({ uri, firstName, size }: { uri: string | null | undefined; firstName: string; size: number }) {
  const styles = useStyles(makeStyles);
  if (!uri) return <MonogramPortrait firstName={firstName} width={size} height={size} radius={size / 2} />;
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" transition={120} accessibilityLabel={`${firstName}'s photo`} />
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  ring: { overflow: 'hidden', backgroundColor: colors.surfaceElevated },
});
