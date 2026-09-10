import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { BRAND } from '@peaches/core';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/components/SettingsRow';
import { spacing, text } from '@/constants/theme';
import { useMember } from '@/lib/auth';

export const SECTIONS = [
  { key: 'account', label: 'Account', icon: 'user' },
  { key: 'privacy', label: 'Privacy', icon: 'eye-off' },
  { key: 'discovery', label: 'Discovery Preferences', icon: 'sliders' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'verification', label: 'Verification', icon: 'check-circle' },
  { key: 'blocked', label: 'Blocked Users', icon: 'users' },
  { key: 'safety', label: 'Safety', icon: 'shield' },
  { key: 'data', label: 'Data & Account', icon: 'lock' },
] as const;

export default function Settings() {
  const router = useRouter();
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
        {SECTIONS.map((s) => (
          <SettingsRow
            key={s.key}
            label={s.label}
            icon={s.icon}
            onPress={() => (s.key === 'discovery' ? router.push('/me/preferences') : router.push({ pathname: '/settings/[section]', params: { section: s.key } }))}
          />
        ))}
        <SettingsRow label="Logout" icon="log-out" onPress={logout} chevron={false} destructive />
        <Text style={[text.micro, styles.foot]}>
          {BRAND.name} · {BRAND.market}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: spacing.xxl },
  foot: { textAlign: 'center', paddingTop: spacing.xl },
});
