import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function Loading({ inline }: { inline?: boolean }) {
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
