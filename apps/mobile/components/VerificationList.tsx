import { StyleSheet, Text, View } from 'react-native';
import {
  VERIFICATION_DIMENSIONS,
  VERIFICATION_LABEL,
  VERIFICATION_STATE_LABEL,
  type VerificationData,
  type VerificationDimension,
} from '@peaches/core';
import { colors, spacing, text } from '@/constants/theme';
import { Button } from './Button';
import { Icon } from './Icon';

interface Props {
  verification: VerificationData;
  onRequest: (dimension: VerificationDimension) => void;
  busy?: VerificationDimension | null;
}

/** The member's own per-dimension states. Others only ever see `verified`. */
export function VerificationList({ verification, onRequest, busy }: Props) {
  return (
    <View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  textWrap: { flex: 1 },
});
