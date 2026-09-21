import { StyleSheet, Text } from 'react-native';
import { spacing } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';

export function ErrorText({ message }: { message: string | null | undefined }) {
  const styles = useStyles(makeStyles);
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={styles.text}>
      {message}
    </Text>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  text: { color: colors.danger, fontSize: 13, lineHeight: 18, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
