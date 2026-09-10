import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { BRAND, longDate, type PrivateUserData, type PublicProfile, type VerificationDimension } from '@peaches/core';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ErrorText } from '@/components/ErrorText';
import { Field } from '@/components/Field';
import { GROUP_INSET, Group } from '@/components/Group';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingsRow } from '@/components/SettingsRow';
import { VerificationList } from '@/components/VerificationList';
import { colors, radius, spacing, text } from '@/constants/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { LEGAL_URLS, supabase } from '@/lib/supabase';

const TITLES: Record<string, string> = {
  account: 'Account',
  privacy: 'Privacy',
  notifications: 'Notifications',
  verification: 'Verification',
  blocked: 'Blocked users',
  safety: 'Safety',
  data: 'Data & account',
};

const switchColors = { trackColor: { true: colors.ivory, false: colors.borderStrong }, thumbColor: colors.canvas };

export default function SettingsSection() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const key = section ?? 'account';
  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title={TITLES[key] ?? 'Settings'} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {key === 'account' ? <Account /> : null}
        {key === 'privacy' ? <Privacy /> : null}
        {key === 'notifications' ? <Notifications /> : null}
        {key === 'verification' ? <Verification /> : null}
        {key === 'blocked' ? <Blocked /> : null}
        {key === 'safety' ? <Safety /> : null}
        {key === 'data' ? <DataAndAccount /> : null}
      </ScrollView>
    </Screen>
  );
}

function Account() {
  const { email, profile } = useMember();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const change = async () => {
    if (password.length < 6) return setError('Use at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setPassword('');
      setConfirm('');
      Alert.alert('Password updated');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View>
      <Group style={styles.firstGroup}>
        <SettingsRow label="Email" value={email} chevron={false} />
        <SettingsRow label="Member since" value={profile ? longDate(profile.createdAt) : ''} chevron={false} />
      </Group>
      <SectionHeader title="Change password" />
      <View style={styles.fields}>
        <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
        <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry textContentType="newPassword" />
        <ErrorText message={error} />
        <Button title="Update password" variant="secondary" onPress={change} loading={busy} disabled={!password} />
      </View>
    </View>
  );
}

function Privacy() {
  const { userId, email, profile, refreshProfile } = useMember();
  const [priv, setPriv] = useState<PrivateUserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => api.profiles.getPrivate(userId, email).then(setPriv).catch((e) => setError(errorMessage(e))), [userId, email]);
  useEffect(() => {
    void load();
  }, [load]);

  const setEducationDisplay = async (value: boolean) => {
    if (!priv?.education) return Alert.alert('Add your education first', 'You can add it in Edit profile.');
    try {
      await api.profiles.updatePrivate(userId, { education: { ...priv.education, publicDisplayEnabled: value } });
      await Promise.all([load(), refreshProfile()]);
    } catch (e) {
      Alert.alert('Could not update', errorMessage(e));
    }
  };
  const setEmployerDisplay = async (value: boolean) => {
    if (!priv?.employment) return Alert.alert('Add your work first', 'You can add it in Edit profile.');
    try {
      await api.profiles.updatePrivate(userId, { employment: { ...priv.employment, publicEmployerDisplayEnabled: value } });
      await Promise.all([load(), refreshProfile()]);
    } catch (e) {
      Alert.alert('Could not update', errorMessage(e));
    }
  };
  const setPreferNotToSay = async (value: boolean) => {
    try {
      await api.profiles.updatePublic(userId, {
        raceEthnicityDisclosure: value ? 'prefer_not_to_say' : (profile?.raceEthnicities.length ?? 0) > 0 ? 'disclosed' : 'not_provided',
        ...(value ? { raceEthnicities: [] } : {}),
      });
      await refreshProfile();
    } catch (e) {
      Alert.alert('Could not update', errorMessage(e));
    }
  };

  if (!priv && !error) return <Loading />;
  return (
    <View>
      <Text style={[text.caption, styles.note]}>
        Your exact area, your preferences, and your verification details are private. Other members see only what is switched on here.
      </Text>
      <SectionHeader title="What others see" />
      <Group>
        <SettingsRow label="Show education" chevron={false} right={<Switch value={priv?.education?.publicDisplayEnabled ?? true} onValueChange={setEducationDisplay} {...switchColors} />} />
        <SettingsRow label="Show employer" chevron={false} right={<Switch value={priv?.employment?.publicEmployerDisplayEnabled ?? true} onValueChange={setEmployerDisplay} {...switchColors} />} />
        <SettingsRow
          label="Race / ethnicity: prefer not to say"
          description="Hides the field and keeps it out of matching entirely."
          chevron={false}
          right={<Switch value={profile?.raceEthnicityDisclosure === 'prefer_not_to_say'} onValueChange={setPreferNotToSay} {...switchColors} />}
        />
      </Group>
      <SectionHeader title="Documents" />
      <Group>
        <SettingsRow label="Privacy Policy" onPress={() => Linking.openURL(LEGAL_URLS.privacy)} />
        <SettingsRow label="Terms of Service" onPress={() => Linking.openURL(LEGAL_URLS.terms)} />
      </Group>
      <ErrorText message={error} />
    </View>
  );
}

function Notifications() {
  return (
    <View style={styles.fields}>
      <Text style={text.body}>Push notifications are not enabled in this build.</Text>
      <Text style={text.bodySmall}>
        New requests, connections, and messages appear in your Inbox when you open {BRAND.name}. Notification controls will live here once push is
        switched on.
      </Text>
    </View>
  );
}

function Verification() {
  const { profile, refreshProfile } = useMember();
  const [busy, setBusy] = useState<VerificationDimension | null>(null);
  if (!profile) return <Loading />;
  const request = async (d: VerificationDimension) => {
    setBusy(d);
    try {
      await api.verification.request(d);
      await refreshProfile();
    } catch (e) {
      Alert.alert('Could not request review', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <View>
      <Text style={[text.caption, styles.note]}>
        Our team reviews the details on your profile by hand. There is no ID upload and no automated check. Only confirmed badges are shown to others;
        pending and declined states stay private to you.
      </Text>
      <View style={{ height: spacing.lg }} />
      <VerificationList verification={profile.verification} onRequest={request} busy={busy} />
    </View>
  );
}

function Blocked() {
  const { userId } = useMember();
  const [people, setPeople] = useState<PublicProfile[] | null>(null);
  const load = useCallback(() => api.safety.listBlocked(userId).then(setPeople).catch(() => setPeople([])), [userId]);
  useEffect(() => {
    void load();
  }, [load]);
  const unblock = (p: PublicProfile) =>
    Alert.alert(`Unblock ${p.firstName}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          await api.safety.unblock(userId, p.id);
          void load();
        },
      },
    ]);
  if (!people) return <Loading />;
  if (people.length === 0) return <Text style={[text.bodySecondary, styles.note]}>You have not blocked anyone.</Text>;
  return (
    <Group inset={spacing.lg + 36 + spacing.md} style={styles.firstGroup}>
      {people.map((p) => (
        <View key={p.id} style={styles.blockedRow}>
          <Avatar uri={p.photos[0] ?? null} firstName={p.firstName} size={36} />
          <Text style={[text.body, { flex: 1 }]}>{p.firstName}</Text>
          <Button title="Unblock" size="small" variant="secondary" onPress={() => unblock(p)} />
        </View>
      ))}
    </Group>
  );
}

function Safety() {
  const tips = [
    'Meet in public places for the first few times, and tell a friend where you will be.',
    'Keep conversations in the app until you feel comfortable.',
    'Never send money or share financial details with someone you have not met.',
    'Trust your judgment. You can block anyone from their profile or a conversation.',
    'Report anything that feels off from a profile, a post, or a conversation. Our team reviews every report.',
  ];
  return (
    <View>
      <Group inset={GROUP_INSET.icon} style={styles.firstGroup}>
        {tips.map((t) => (
          <View key={t} style={styles.tip}>
            <Icon name="shield" size={18} color={colors.textSecondary} />
            <Text style={[text.body, { flex: 1, color: colors.textSecondary }]}>{t}</Text>
          </View>
        ))}
      </Group>
      <Text style={[text.caption, styles.note, { paddingTop: spacing.md }]}>If you are in immediate danger, contact local emergency services.</Text>
    </View>
  );
}

function DataAndAccount() {
  const router = useRouter();
  const { profile, signOut } = useMember();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const remove = () =>
    Alert.alert('Delete your account?', 'Your profile, photos, posts, connections, and messages are permanently deleted. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete permanently',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await api.safety.deleteMyAccount(profile?.photoPaths ?? []);
            await signOut();
            router.replace('/');
          } catch (e) {
            Alert.alert('Could not delete account', errorMessage(e));
            setBusy(false);
          }
        },
      },
    ]);
  return (
    <View style={styles.fields}>
      <Text style={text.bodySmall}>
        You can request a copy of your data or ask questions about how it is used by writing to {BRAND.supportEmail}. Deleting your account removes
        everything you have shared with {BRAND.name}.
      </Text>
      {!armed ? (
        <Button title="Delete my account" variant="danger" onPress={() => setArmed(true)} />
      ) : (
        <View style={styles.dangerBox}>
          <Text style={text.body}>Are you sure? This removes your account permanently.</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title="Yes, delete" variant="danger" size="small" onPress={remove} loading={busy} />
            <Button title="Keep my account" variant="ghost" size="small" onPress={() => setArmed(false)} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: spacing.xxl },
  fields: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  note: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  firstGroup: { marginTop: spacing.sm },
  blockedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  dangerBox: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.danger, gap: spacing.md },
});
