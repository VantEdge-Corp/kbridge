import { StyleSheet, Text } from 'react-native';
import { colors, spacing } from '@/constants/theme';

export function ErrorText({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={styles.text}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.danger, fontSize: 13, lineHeight: 18, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
