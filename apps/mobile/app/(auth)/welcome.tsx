import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BRAND } from '@peaches/core';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { fonts, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';

export default function Welcome() {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.brand}>
          <Wordmark size={26} />
          <Text style={styles.tagline}>{BRAND.tagline}</Text>
          <Text style={[text.bodySmall, styles.lede]}>
            A verified community for meeting people in {BRAND.market}, by application.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button title="Apply for membership" onPress={() => router.push('/(auth)/apply')} fullWidth />
          <Button title="Sign in" variant="secondary" onPress={() => router.push('/(auth)/login')} fullWidth />
          <Button title="Check application status" variant="ghost" onPress={() => router.push('/(auth)/status')} fullWidth />
        </View>
        <Text style={[text.micro, styles.foot]}>Members only. Every application is read by a person.</Text>
      </View>
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between', paddingBottom: spacing.xl },
  brand: { flex: 1, justifyContent: 'center', gap: spacing.md },
  tagline: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.text, marginTop: spacing.md },
  lede: { maxWidth: 300, marginTop: spacing.xs },
  actions: { gap: spacing.md },
  foot: { textAlign: 'center', marginTop: spacing.lg },
});
