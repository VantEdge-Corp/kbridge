import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatHeight, nameAge, profileCompleteness, type VerificationDimension } from '@peaches/core';
import { Avatar } from '@/components/Avatar';
import { CompletenessBar } from '@/components/CompletenessBar';
import { GROUP_INSET, Group } from '@/components/Group';
import { Header, HeaderIconButton } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingsRow } from '@/components/SettingsRow';
import { VerificationBadge } from '@/components/VerificationBadge';
import { VerificationList } from '@/components/VerificationList';
import { spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

const PORTRAIT = 96;

/** Me is a hub: a centered portrait, the name, one line, the completeness card, then grouped rows. Editing happens on its own screens. */
export default function Me() {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  const router = useRouter();
  const { userId, profile, refreshProfile } = useMember();
  const [refreshing, setRefreshing] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState<VerificationDimension | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);
  useRefreshOnFocus(refreshProfile);

  const requestVerification = async (dimension: VerificationDimension) => {
    setVerifyBusy(dimension);
    try {
      await api.verification.request(dimension);
      await refreshProfile();
    } catch (e) {
      Alert.alert('Could not request review', errorMessage(e));
    } finally {
      setVerifyBusy(null);
    }
  };

  if (!profile) {
    return (
      <Screen>
        <Header title="Me" />
        <Loading />
      </Screen>
    );
  }

  const completeness = profileCompleteness({
    photos: profile.photos.length,
    bio: profile.bio,
    occupation: profile.occupation,
    educationDisplay: profile.educationDisplay,
    height: profile.height,
    nationalities: profile.nationalities.length,
    languages: profile.languages.length,
    relationshipIntent: profile.relationshipIntent,
    interests: profile.interests.length,
    displayArea: profile.displayArea === 'Metro Atlanta' ? '' : profile.displayArea,
  });
  const meta = [profile.employmentDisplay || profile.occupation, profile.displayArea, profile.height ? formatHeight(profile.height) : null].filter(Boolean).join(' · ');

  return (
    <Screen>
      <Header title="Me" right={<HeaderIconButton name="settings" label="Settings" onPress={() => router.push('/settings')} />} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textSecondary} />}>
        <View style={styles.identity}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={profile.photos.length > 0 ? 'Edit photos' : 'Add photos'}
            onPress={() => router.push('/me/photos')}
            style={({ pressed }) => [styles.portrait, pressed && { opacity: 0.85 }]}
          >
            <Avatar uri={profile.photos[0] ?? null} firstName={profile.firstName} size={PORTRAIT} />
            <View style={styles.editDisc}>
              <Icon name={profile.photos.length > 0 ? 'edit-2' : 'plus'} size={13} color={colors.onIvory} />
            </View>
          </Pressable>
          <View style={styles.nameRow}>
            <Text style={text.heading}>{nameAge(profile.firstName, profile.age)}</Text>
            {profile.publicVerificationBadges.length > 0 ? <VerificationBadge size={16} /> : null}
          </View>
          {meta ? (
            <Text style={[text.bodySmall, styles.meta]} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>

        <Group style={styles.card}>
          <View style={styles.cardInner}>
            <CompletenessBar percent={completeness} />
            <Text style={text.caption}>
              {completeness < 100 ? 'Complete profiles are shown more often and read better.' : 'Your profile is complete.'}
            </Text>
          </View>
        </Group>

        <SectionHeader title="Profile" />
        <Group inset={GROUP_INSET.icon}>
          <SettingsRow label="Edit profile" icon="edit-2" onPress={() => router.push('/me/edit')} />
          <SettingsRow label="Photos" icon="image" value={`${profile.photos.length} of 6`} onPress={() => router.push('/me/photos')} />
          <SettingsRow label="Discovery preferences" icon="sliders" onPress={() => router.push('/me/preferences')} />
          <SettingsRow label="Saved posts" icon="bookmark" onPress={() => router.push('/me/saved')} />
          <SettingsRow label="View as others see you" icon="eye" onPress={() => router.push({ pathname: '/profile/[id]', params: { id: userId } })} />
        </Group>

        <SectionHeader title="Verification" />
        <VerificationList verification={profile.verification} onRequest={requestVerification} busy={verifyBusy} />
        <Text style={[text.caption, styles.note]}>Verification is a manual review by our team of the details on your profile. Only confirmed badges are shown to others.</Text>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  content: { paddingTop: spacing.sm, paddingBottom: 40 },
  identity: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.xs },
  portrait: { marginBottom: spacing.sm },
  editDisc: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ivory,
    borderWidth: 3,
    borderColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { textAlign: 'center' },
  card: { marginTop: spacing.xl },
  cardInner: { padding: spacing.lg, gap: spacing.md },
  note: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
