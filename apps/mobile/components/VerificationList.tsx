import { StyleSheet, Text, View } from 'react-native';
import {
  VERIFICATION_DIMENSIONS,
  VERIFICATION_LABEL,
  VERIFICATION_STATE_LABEL,
  type VerificationData,
  type VerificationDimension,
  type VerificationState,
} from '@peaches/core';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { Button } from './Button';
import { GROUP_INSET, Group } from './Group';
import { Icon, type IconName } from './Icon';

interface Props {
  verification: VerificationData;
  onRequest: (dimension: VerificationDimension) => void;
  busy?: VerificationDimension | null;
}

const STATE_ICON: Record<VerificationState, IconName> = {
  verified: 'badge-check',
  pending: 'clock-3',
  rejected: 'circle-x',
  unverified: 'circle-dashed',
};

/** The member's own state per dimension, as the web's list. Others only ever see `verified`. */
export function VerificationList({ verification, onRequest, busy }: Props) {
  const { colors, text } = useTheme();
  return (
    <Group inset={GROUP_INSET.icon}>
      {VERIFICATION_DIMENSIONS.map((d) => {
        const state = verification[d];
        const color = state === 'verified' ? colors.verified : colors.mutedForeground;
        return (
          <View key={d} style={styles.row}>
            <Icon name={STATE_ICON[state]} size={20} color={color} />
            <View style={styles.textWrap}>
              <Text style={[text.body, styles.label]}>{VERIFICATION_LABEL[d]}</Text>
              <Text style={[text.caption, styles.state, state === 'verified' && { color: colors.foreground }]}>{VERIFICATION_STATE_LABEL[state]}</Text>
            </View>
            {state === 'unverified' || state === 'rejected' ? (
              <Button title="Request review" variant="outline" size="sm" onPress={() => onRequest(d)} loading={busy === d} />
            ) : null}
          </View>
        );
      })}
    </Group>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 60 },
  textWrap: { flex: 1, gap: 1 },
  label: { fontWeight: '500' },
  state: { fontSize: 13, lineHeight: 18 },
});
