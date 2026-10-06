import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { BRAND } from '@peaches/core';
import { GROUP_INSET, Group } from '@/components/Group';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/components/SettingsRow';
import { SETTINGS_SECTIONS } from '@/constants/settings';
import { spacing } from '@/constants/theme';
import { THEME_PREFERENCES, useTheme } from '@/lib/theme';
import { useMember } from '@/lib/auth';

export default function Settings() {
  const { text, preference } = useTheme();
  const router = useRouter();
  const appearance = THEME_PREFERENCES.find((p) => p.value === preference)?.label;
  const { signOut } = useMember();
  const logout = () =>
    Alert.alert('Log out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
    ]);
  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title="Settings" />
      <ScrollView contentContainerStyle={styles.body}>
        <Group inset={GROUP_INSET.icon}>
          {SETTINGS_SECTIONS.map((s) => (
            <SettingsRow
              key={s.key}
              label={s.label}
              icon={s.icon}
              value={s.key === 'appearance' ? appearance : undefined}
              onPress={() => (s.key === 'discovery' ? router.push('/me/preferences') : router.push({ pathname: '/settings/[section]', params: { section: s.key } }))}
            />
          ))}
        </Group>
        <Group inset={GROUP_INSET.icon} style={styles.logout}>
          <SettingsRow label="Log out" icon="log-out" onPress={logout} chevron={false} destructive />
        </Group>
        <Text style={[text.micro, styles.foot]}>
          {BRAND.name} · {BRAND.market}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  logout: { marginTop: spacing.lg },
  foot: { textAlign: 'center', paddingTop: spacing.xl },
});
