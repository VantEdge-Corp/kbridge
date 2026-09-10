import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CHILDREN_OPTIONS,
  DRINKING_OPTIONS,
  EXERCISE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  RACE_ETHNICITY_OPTIONS,
  RELATIONSHIP_INTENT_OPTIONS,
  SMOKING_OPTIONS,
  STUDENT_STATUS_OPTIONS,
  VERIFICATION_LABEL,
  countryName,
  formatHeight,
  labelFor,
  nameAge,
  timeAgo,
  type Post,
  type PublicProfile,
} from '@peaches/core';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { IntroductionNoteSheet } from '@/components/IntroductionNoteSheet';
import { Loading } from '@/components/Loading';
import { MonogramPortrait } from '@/components/MonogramPortrait';
import { MetaChips, MetaRow, MetaSection } from '@/components/ProfileMetadata';
import { ReportSheet } from '@/components/ReportSheet';
import { Screen } from '@/components/Screen';
import { ActionSheet } from '@/components/Sheet';
import { ChipRow, TagChip } from '@/components/TagChip';
import { VerificationBadge } from '@/components/VerificationBadge';
import { colors, radius, spacing, text, touch } from '@/constants/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

type Relationship = { kind: 'none' } | { kind: 'pending' } | { kind: 'incoming' } | { kind: 'connected'; matchId: string };

export default function ProfileView() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useMember();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [posts, setPosts] = useState<Post[]>([]);
  const [relationship, setRelationship] = useState<Relationship>({ kind: 'none' });
  const [page, setPage] = useState(0);
  const [noteOpen, setNoteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const own = id === userId;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [p, authored] = await Promise.all([api.profiles.get(id), api.posts.listByAuthor(id, userId, 5)]);
      setProfile(p);
      setPosts(authored);
      if (p && !own) {
        const [incoming, outgoing, connections] = await Promise.all([
          api.introductions.listIncoming(userId),
          api.introductions.listOutgoing(userId),
          api.connections.list(userId),
        ]);
        const connection = connections.find((c) => c.counterpart.id === id);
        if (connection) setRelationship({ kind: 'connected', matchId: connection.matchId });
        else if (incoming.some((r) => r.counterpart.id === id)) setRelationship({ kind: 'incoming' });
        else if (outgoing.some((r) => r.counterpart.id === id)) setRelationship({ kind: 'pending' });
        else setRelationship({ kind: 'none' });
      }
    } catch (e) {
      Alert.alert('Could not load profile', errorMessage(e));
      setProfile(null);
    }
  }, [id, userId, own]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendRequest = async (note: string) => {
    if (!profile) return;
    await api.introductions.request({ viewerId: userId, recipientId: profile.id, note });
    setNoteOpen(false);
    setRelationship({ kind: 'pending' });
  };

  const block = () => {
    if (!profile) return;
    Alert.alert(`Block ${profile.firstName}?`, 'You will no longer see each other anywhere in Peaches.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.safety.block(userId, profile.id);
            router.back();
          } catch (e) {
            Alert.alert('Could not block', errorMessage(e));
          }
        },
      },
    ]);
  };

  const fileReport = async (reason: string) => {
    if (!profile) return;
    try {
      await api.safety.report({ reporterId: userId, reportedId: profile.id, reason });
      Alert.alert('Report received', 'Our team will review it.');
    } catch (e) {
      Alert.alert('Could not report', errorMessage(e));
    } finally {
      setReportOpen(false);
    }
  };

  if (profile === undefined) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back />
        <Loading />
      </Screen>
    );
  }
  if (profile === null) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back />
        <View style={styles.center}>
          <Text style={text.bodySecondary}>This member isn&apos;t available.</Text>
        </View>
      </Screen>
    );
  }

  const photoHeight = Math.round(width / 0.75);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  const disclosedRace = profile.raceEthnicityDisclosure === 'disclosed' ? profile.raceEthnicities.map((r) => labelFor(RACE_ETHNICITY_OPTIONS, r)) : [];
  const lifestyle = [
    profile.lifestyle.drinking && profile.lifestyle.drinking !== 'prefer_not_to_say' ? `Drinks: ${labelFor(DRINKING_OPTIONS, profile.lifestyle.drinking).toLowerCase()}` : null,
    profile.lifestyle.smoking && profile.lifestyle.smoking !== 'prefer_not_to_say' ? `Smokes: ${labelFor(SMOKING_OPTIONS, profile.lifestyle.smoking).toLowerCase()}` : null,
    profile.lifestyle.exercise ? `Exercise: ${labelFor(EXERCISE_OPTIONS, profile.lifestyle.exercise).toLowerCase()}` : null,
    profile.lifestyle.children && profile.lifestyle.children !== 'prefer_not_to_say' ? labelFor(CHILDREN_OPTIONS, profile.lifestyle.children) : null,
  ].filter((v): v is string => !!v);

  return (
    <Screen edges={['top']}>
      <Header
        back
        right={
          !own ? (
            <Pressable accessibilityRole="button" accessibilityLabel="More options" onPress={() => setMoreOpen(true)} style={styles.more} hitSlop={6}>
              <Icon name="more-horizontal" size={20} color={colors.textSecondary} />
            </Pressable>
          ) : (
            <Button title="Edit" size="small" variant="ghost" onPress={() => router.push('/me/edit')} />
          )
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}>
        {profile.photos.length > 0 ? (
          <View>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} scrollEventThrottle={16}>
              {profile.photos.map((uri, i) => (
                <Image key={uri} source={{ uri }} style={{ width, height: photoHeight, backgroundColor: colors.surfaceElevated }} contentFit="cover" transition={150} accessibilityLabel={`${profile.firstName}'s photo ${i + 1}`} />
              ))}
            </ScrollView>
            {profile.photos.length > 1 ? (
              <View style={styles.dots}>
                {profile.photos.map((uri, i) => (
                  <View key={uri} style={[styles.dot, i === page && styles.dotOn]} />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.monogramWrap}>
            <MonogramPortrait firstName={profile.firstName} width={width - spacing.lg * 2} height={Math.round((width - spacing.lg * 2) * 0.9)} radius={radius.lg} />
          </View>
        )}

        <View style={styles.basic}>
          <View style={styles.nameRow}>
            <Text style={text.heading}>{nameAge(profile.firstName, profile.age)}</Text>
            {profile.publicVerificationBadges.length > 0 ? <VerificationBadge size={16} /> : null}
          </View>
          <Text style={text.bodySmall}>
            {[profile.displayArea, profile.height ? formatHeight(profile.height) : null].filter(Boolean).join(' · ')}
          </Text>
          {own ? <Text style={[text.caption, { marginTop: spacing.xs }]}>This is you, as other members see you.</Text> : null}
          {profile.bio ? <Text style={[text.body, { marginTop: spacing.md }]}>{profile.bio}</Text> : null}
        </View>

        <MetaSection title="Background">
          <MetaRow label="Work" value={profile.employmentDisplay || profile.occupation} />
          <MetaRow label="Education" value={profile.educationDisplay} />
          <MetaRow label="Field" value={labelFor(INDUSTRY_OPTIONS, profile.industry)} />
          <MetaRow label="Status" value={labelFor(STUDENT_STATUS_OPTIONS, profile.studentStatus)} />
          <MetaChips label="Nationality" items={profile.nationalities.map(countryName)} />
          <MetaChips label="Ethnicity" items={disclosedRace} />
          <MetaChips label="Languages" items={profile.languages.map((l) => labelFor(LANGUAGE_OPTIONS, l))} />
        </MetaSection>

        <MetaSection title="Intent">
          <MetaRow label="Looking for" value={labelFor(RELATIONSHIP_INTENT_OPTIONS, profile.relationshipIntent)} />
        </MetaSection>

        <MetaSection title="Lifestyle">
          <MetaChips label="Habits" items={lifestyle} />
        </MetaSection>

        {profile.interests.length > 0 ? (
          <View style={styles.section}>
            <Text style={text.eyebrow}>Interests</Text>
            <ChipRow>
              {profile.interests.map((i) => (
                <TagChip key={i} label={i} />
              ))}
            </ChipRow>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={text.eyebrow}>Verification</Text>
          {profile.publicVerificationBadges.length > 0 ? (
            <View style={styles.badges}>
              {profile.publicVerificationBadges.map((b) => (
                <VerificationBadge key={b} label={`${VERIFICATION_LABEL[b]} verified`} size={15} />
              ))}
            </View>
          ) : (
            <Text style={text.caption}>No verified details yet.</Text>
          )}
          <Text style={text.caption}>Verified means our team reviewed the details this member provided.</Text>
        </View>

        {posts.length > 0 ? (
          <View style={styles.section}>
            <Text style={text.eyebrow}>Posts</Text>
            {posts.map((p) => (
              <Pressable key={p.id} onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })} accessibilityRole="button" style={styles.postRow}>
                <Text style={text.body} numberOfLines={3}>
                  {p.body}
                </Text>
                <Text style={text.micro}>{timeAgo(p.createdAt)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {!own ? (
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {relationship.kind === 'connected' ? (
            <Button title="Message" fullWidth onPress={() => router.push({ pathname: '/chat/[matchId]', params: { matchId: relationship.matchId } })} />
          ) : relationship.kind === 'pending' ? (
            <Button title="Request sent" fullWidth disabled />
          ) : relationship.kind === 'incoming' ? (
            <Button title={`${profile.firstName} wrote to you · Respond in Inbox`} fullWidth onPress={() => router.push('/inbox')} />
          ) : (
            <Button title="Interested" fullWidth onPress={() => setNoteOpen(true)} />
          )}
        </View>
      ) : null}

      <IntroductionNoteSheet visible={noteOpen} onClose={() => setNoteOpen(false)} recipientFirstName={profile.firstName} onSubmit={sendRequest} />
      <ActionSheet
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        actions={[
          { label: 'Report', destructive: true, onPress: () => setReportOpen(true) },
          { label: `Block ${profile.firstName}`, destructive: true, onPress: block },
        ]}
      />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} onSelect={fileReport} title={`Report ${profile.firstName}`} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  more: { width: touch.minTarget, height: touch.minTarget, alignItems: 'flex-end', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ivory, opacity: 0.35 },
  dotOn: { opacity: 1 },
  monogramWrap: { paddingHorizontal: spacing.lg },
  basic: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  badges: { gap: spacing.sm },
  postRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 4 },
  actionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.border },
});
