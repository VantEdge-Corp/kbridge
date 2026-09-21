import { StyleSheet, Text, View } from 'react-native';
import {
  VERIFICATION_DIMENSIONS,
  VERIFICATION_LABEL,
  VERIFICATION_STATE_LABEL,
  type VerificationData,
  type VerificationDimension,
} from '@peaches/core';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { Button } from './Button';
import { Group } from './Group';
import { Icon } from './Icon';

interface Props {
  verification: VerificationData;
  onRequest: (dimension: VerificationDimension) => void;
  busy?: VerificationDimension | null;
}

/** The member's own per-dimension states in a grouped list. Others only ever see `verified`. */
export function VerificationList({ verification, onRequest, busy }: Props) {
  const { colors, text } = useTheme();
  return (
    <Group inset={spacing.lg + 16 + spacing.md}>
      {VERIFICATION_DIMENSIONS.map((d) => {
        const state = verification[d];
        const color = state === 'verified' ? colors.verified : state === 'pending' ? colors.textSecondary : colors.textMuted;
        return (
          <View key={d} style={styles.row}>
            <Icon name={state === 'verified' ? 'check-circle' : state === 'pending' ? 'clock' : 'circle'} size={16} color={color} />
            <View style={styles.textWrap}>
              <Text style={text.body}>{VERIFICATION_LABEL[d]}</Text>
              <Text style={[text.caption, { color }]}>{VERIFICATION_STATE_LABEL[state]}</Text>
            </View>
            {state === 'unverified' || state === 'rejected' ? (
              <Button title="Request review" variant="secondary" size="small" onPress={() => onRequest(d)} loading={busy === d} />
            ) : null}
          </View>
        );
      })}
    </Group>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56 },
  textWrap: { flex: 1, gap: 1 },
});
