import { StyleSheet, Text, View } from 'react-native';
import { spacing, text } from '@/constants/theme';
import { Button } from './Button';

/** Centered, one sentence in `textSecondary`, an optional single secondary action, 48px vertical padding. */
export function EmptyState({ title, body, actionTitle, onAction }: { title: string; body?: string; actionTitle?: string; onAction?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={[text.bodySecondary, styles.center]}>{title}</Text>
      {body ? <Text style={[text.caption, styles.center, { marginTop: 6 }]}>{body}</Text> : null}
      {actionTitle && onAction ? <Button title={actionTitle} variant="secondary" size="small" onPress={onAction} style={{ marginTop: spacing.lg }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, alignItems: 'center' },
  center: { textAlign: 'center', maxWidth: 320 },
});
