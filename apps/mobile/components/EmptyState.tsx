import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface Props {
  title: string;
  body?: string;
  /** Drawn in a 40px `muted` square above the title, as shadcn's Empty. */
  icon?: IconName;
  actionTitle?: string;
  onAction?: () => void;
}

/** shadcn/ui's Empty: an optional icon tile, a title, one calm line, at most one outline action. */
export function EmptyState({ title, body, icon, actionTitle, onAction }: Props) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={styles.tile}>
          <Icon name={icon} size={22} color={colors.foreground} />
        </View>
      ) : null}
      {/* push-out keeps a single word from ending up alone on the last line of centered text. */}
      <Text style={styles.title} lineBreakStrategyIOS="push-out">
        {title}
      </Text>
      {body ? (
        <Text style={[text.bodySmall, styles.body]} lineBreakStrategyIOS="push-out">
          {body}
        </Text>
      ) : null}
      {actionTitle && onAction ? <Button title={actionTitle} variant="outline" size="sm" onPress={onAction} style={{ marginTop: spacing.xl }} /> : null}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    wrap: { paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, alignItems: 'center' },
    tile: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
    title: { fontSize: 18, lineHeight: 26, fontWeight: '600', letterSpacing: -0.45, color: colors.foreground, textAlign: 'center', maxWidth: 320 },
    body: { textAlign: 'center', maxWidth: 300, marginTop: spacing.sm },
  });
