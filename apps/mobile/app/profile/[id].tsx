import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { timeAgo, type IntroductionRequest, type Post, type PublicProfile } from '@peaches/core';
import { Button } from '@/components/Button';
import { Header, HeaderIconButton } from '@/components/Header';
import { IntroductionNoteSheet } from '@/components/IntroductionNoteSheet';
import { Loading } from '@/components/Loading';
import { NoteCard } from '@/components/ProfileBlocks';
import { ProfileStory } from '@/components/ProfileStory';
import { ReportSheet } from '@/components/ReportSheet';
import { Screen } from '@/components/Screen';
import { ActionSheet } from '@/components/Sheet';
import { VerificationBadge } from '@/components/VerificationBadge';
import { spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

type Relationship = { kind: 'none' } | { kind: 'pending' } | { kind: 'incoming'; request: IntroductionRequest } | { kind: 'connected'; matchId: string };

/** How far the identity block travels under the header before the name has fully faded in there. */
const NAME_FADE_DISTANCE = 24;

export default function ProfileView() {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useMember();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [posts, setPosts] = useState<Post[]>([]);
  const [relationship, setRelationship] = useState<Relationship>({ kind: 'none' });
  const [noteOpen, setNoteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nameY, setNameY] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
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
        const request = incoming.find((r) => r.counterpart.id === id);
        if (connection) setRelationship({ kind: 'connected', matchId: connection.matchId });
        else if (request) setRelationship({ kind: 'incoming', request });
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

  const accept = async () => {
    if (relationship.kind !== 'incoming') return;
    setBusy(true);
    try {
      const matchId = await api.introductions.accept(relationship.request.id);
      router.replace({ pathname: '/chat/[matchId]', params: { matchId } });
    } catch (e) {
      Alert.alert('Could not accept', errorMessage(e));
      setBusy(false);
    }
  };

  const decline = () => {
    if (relationship.kind !== 'incoming' || !profile) return;
    const { request } = relationship;
    Alert.alert(`Decline ${profile.firstName}'s request?`, 'The request is closed quietly. They are not told.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await api.introductions.decline(request.id);
            router.back();
          } catch (e) {
            Alert.alert('Could not decline', errorMessage(e));
            setBusy(false);
          }
        },
      },
    ]);
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

  const contentWidth = width - spacing.lg * 2;
  const verified = profile.publicVerificationBadges.length > 0;
  const fadeStart = Math.max(nameY, 1);
  const headerNameOpacity = scrollY.interpolate({ inputRange: [fadeStart, fadeStart + NAME_FADE_DISTANCE], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Screen edges={['top']}>
      <Header
        back
        center={
          <Animated.View style={[styles.headerName, { opacity: headerNameOpacity }]}>
            <Text style={text.name} numberOfLines={1}>
              {profile.firstName}
            </Text>
            {verified ? <VerificationBadge size={14} /> : null}
          </Animated.View>
        }
        right={
          !own ? (
            <HeaderIconButton name="more-horizontal" label="More options" onPress={() => setMoreOpen(true)} />
          ) : (
            <Button title="Edit" size="small" variant="ghost" onPress={() => router.push('/me/edit')} />
          )
        }
      />
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: (own ? 24 : 96) + insets.bottom }]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <ProfileStory
          profile={profile}
          width={contentWidth}
          posts={posts}
          own={own}
          onIdentityLayout={setNameY}
          afterIdentity={
            relationship.kind === 'incoming' ? (
              <NoteCard eyebrow={`${profile.firstName} wrote to you · ${timeAgo(relationship.request.createdAt)}`}>{relationship.request.note}</NoteCard>
            ) : undefined
          }
        />
      </Animated.ScrollView>

      {!own ? (
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {relationship.kind === 'connected' ? (
            <Button title="Message" fullWidth onPress={() => router.push({ pathname: '/chat/[matchId]', params: { matchId: relationship.matchId } })} />
          ) : relationship.kind === 'pending' ? (
            <Button title="Request sent" fullWidth disabled />
          ) : relationship.kind === 'incoming' ? (
            <View style={styles.decision}>
              <Button title="Decline" variant="secondary" onPress={decline} disabled={busy} style={{ flex: 1 }} />
              <Button title="Accept" onPress={accept} loading={busy} style={{ flex: 2 }} />
            </View>
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

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    content: { paddingTop: spacing.xs, gap: spacing.lg },
    headerName: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    decision: { flexDirection: 'row', gap: spacing.md },
    actionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.border },
  });
