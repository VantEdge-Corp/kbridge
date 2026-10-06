import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BRAND, taglineParts } from '@peaches/core';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';

/** The front door, as the web's landing hero: wordmark, ruled kicker, the tagline in the display serif. */
export default function Welcome() {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  const router = useRouter();
  const [before, emphasis, after] = taglineParts();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.top}>
          <Wordmark size={25} />
        </View>
        <View style={styles.hero}>
          <View style={styles.kicker}>
            <View style={styles.rule} />
            <Text style={text.eyebrow}>Members only · {BRAND.market}</Text>
            <View style={styles.rule} />
          </View>
          <Text style={[text.display, styles.headline]} accessibilityRole="header">
            {before}
            <Text style={text.displayItalic}>{emphasis}</Text>
            {after}
          </Text>
          <Text style={[text.bodySecondary, styles.lede]}>A private, verified circle for adults in {BRAND.market}. Membership is by application.</Text>
        </View>
        <View style={styles.actions}>
          <Button title="Apply for membership" onPress={() => router.push('/(auth)/apply')} fullWidth />
          <Button title="Sign in" variant="outline" onPress={() => router.push('/(auth)/login')} fullWidth />
          <Button title="Check application status" variant="ghost" onPress={() => router.push('/(auth)/status')} fullWidth />
        </View>
        <Text style={[text.micro, styles.foot]}>Every application is read by a person.</Text>
      </View>
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    body: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
    top: { alignItems: 'center', paddingTop: spacing.lg },
    hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
    kicker: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rule: { width: 28, height: StyleSheet.hairlineWidth, backgroundColor: colors.mutedForeground, opacity: 0.5 },
    headline: { textAlign: 'center', maxWidth: 360 },
    lede: { textAlign: 'center', maxWidth: 300 },
    actions: { gap: spacing.md },
    foot: { textAlign: 'center', marginTop: spacing.lg },
  });
