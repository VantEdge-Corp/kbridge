import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';
import { MonogramPortrait } from './MonogramPortrait';

/** Always circular. Inbox rows 40, feed 36, small 28. */
export function Avatar({ uri, firstName, size }: { uri: string | null | undefined; firstName: string; size: number }) {
  if (!uri) return <MonogramPortrait firstName={firstName} width={size} height={size} radius={size / 2} />;
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" transition={120} accessibilityLabel={`${firstName}'s photo`} />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { overflow: 'hidden', backgroundColor: colors.surfaceElevated },
});
