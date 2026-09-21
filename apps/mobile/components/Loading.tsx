import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme';

export function Loading({ inline }: { inline?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={inline ? styles.inline : styles.full}>
      <ActivityIndicator color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl },
  inline: { paddingVertical: spacing.xl, alignItems: 'center' },
});
