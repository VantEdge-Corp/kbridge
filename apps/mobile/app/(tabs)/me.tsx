import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatHeight, nameAge, profileCompleteness, type VerificationDimension } from '@peaches/core';
import { CompletenessBar } from '@/components/CompletenessBar';
import { GROUP_INSET, Group } from '@/components/Group';
import { Header, HeaderIconButton } from '@/components/Header';
import { Loading } from '@/components/Loading';
import { ProfilePhotoGallery } from '@/components/ProfilePhotoGallery';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingsRow } from '@/components/SettingsRow';
import { VerificationBadge } from '@/components/VerificationBadge';
import { VerificationList } from '@/components/VerificationList';
import { colors, spacing, text } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { pickImage } from '@/lib/images';

export default function Me() {
  const router = useRouter();
  const { userId, profile, refreshProfile } = useMember();
  const [refreshing, setRefreshing] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
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

  const addPhoto = async () => {
    if (!profile) return;
    try {
      const upload = await pickImage({ aspect: [3, 4] });
      if (!upload) return;
      setPhotoBusy(true);
      await api.profiles.addPhoto(userId, profile.photoPaths, upload);
      await refreshProfile();
    } catch (e) {
      Alert.alert('Could not add photo', errorMessage(e));
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = (path: string) => {
    if (!profile) return;
    Alert.alert('Remove this photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.profiles.removePhoto(userId, profile.photoPaths, path);
            await refreshProfile();
          } catch (e) {
            Alert.alert('Could not remove photo', errorMessage(e));
          }
        },
      },
    ]);
  };

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
  const photos = profile.photoPaths.map((path, i) => ({ path, url: profile.photos[i] ?? '' })).filter((p) => p.url);
  const meta = [profile.employmentDisplay || profile.occupation, profile.displayArea, profile.height ? formatHeight(profile.height) : null].filter(Boolean).join(' · ');

  return (
    <Screen>
      <Header title="Me" right={<HeaderIconButton name="settings" label="Settings" onPress={() => router.push('/settings')} />} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textSecondary} />}>
        <ProfilePhotoGallery photos={photos} onAdd={addPhoto} onRemove={removePhoto} busy={photoBusy} />
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={text.heading}>{nameAge(profile.firstName, profile.age)}</Text>
            {profile.publicVerificationBadges.length > 0 ? <VerificationBadge size={16} /> : null}
          </View>
          {meta ? <Text style={text.bodySmall}>{meta}</Text> : null}
          {profile.bio ? (
            <Text style={[text.bodySecondary, { marginTop: spacing.xs }]} numberOfLines={3}>
              {profile.bio}
            </Text>
          ) : (
            <Text style={[text.caption, { marginTop: spacing.xs }]}>Add a few lines about yourself in Edit profile.</Text>
          )}
        </View>
        <Group style={styles.card}>
          <View style={styles.cardInner}>
            <CompletenessBar percent={completeness} />
            <Text style={text.caption}>Complete profiles are shown more often and read better.</Text>
          </View>
        </Group>

        <SectionHeader title="Profile" />
        <Group inset={GROUP_INSET.icon}>
          <SettingsRow label="Edit profile" icon="edit-2" onPress={() => router.push('/me/edit')} />
          <SettingsRow label="Discovery preferences" icon="sliders" onPress={() => router.push('/me/preferences')} />
          <SettingsRow label="Photos" icon="image" value={`${profile.photos.length} of 6`} onPress={() => router.push('/me/photos')} />
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

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm, paddingBottom: 40 },
  identity: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  card: { marginTop: spacing.lg },
  cardInner: { padding: spacing.lg, gap: spacing.md },
  note: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});
