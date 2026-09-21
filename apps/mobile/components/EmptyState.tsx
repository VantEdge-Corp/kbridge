import { StyleSheet, Text, View } from 'react-native';
import { fonts, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface Props {
  title: string;
  body?: string;
  /** A 20px muted icon in a 48px surface disc above the title. */
  icon?: IconName;
  actionTitle?: string;
  onAction?: () => void;
}

/** Centered: an optional icon disc, a Georgia title, one calm line, an optional single secondary action. */
export function EmptyState({ title, body, icon, actionTitle, onAction }: Props) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={styles.disc}>
          <Icon name={icon} size={20} color={colors.textMuted} />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={[text.bodySmall, styles.body]}>{body}</Text> : null}
      {actionTitle && onAction ? <Button title={actionTitle} variant="secondary" size="small" onPress={onAction} style={{ marginTop: spacing.xl }} /> : null}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  wrap: { paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, alignItems: 'center' },
  disc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.text, textAlign: 'center', maxWidth: 320 },
  body: { color: colors.textMuted, textAlign: 'center', maxWidth: 300, marginTop: spacing.sm },
});
