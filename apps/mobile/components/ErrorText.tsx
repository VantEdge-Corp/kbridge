import { StyleSheet, Text } from 'react-native';
import { spacing } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';

/** An inline error line. Pass `flush` inside a form that already has side padding, so it lines up with the fields. */
export function ErrorText({ message, flush = false }: { message: string | null | undefined; flush?: boolean }) {
  const styles = useStyles(makeStyles);
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={[styles.text, flush && styles.flush]}>
      {message}
    </Text>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  text: { color: colors.danger, fontSize: 13, lineHeight: 18, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  flush: { paddingHorizontal: 0 },
});
