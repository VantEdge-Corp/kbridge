import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { timeAgo, truncate, type Connection, type IntroductionRequest } from '@peaches/core';
import { Button } from '@/components/Button';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { EmptyState } from '@/components/EmptyState';
import { ErrorText } from '@/components/ErrorText';
import { GROUP_INSET, Group } from '@/components/Group';
import { Header } from '@/components/Header';
import { InboxRow } from '@/components/InboxRow';
import { Loading } from '@/components/Loading';
import { PersonCard } from '@/components/PersonCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { GRID_GAP, PAGE_PADDING, cardWidthFor } from '@/constants/layout';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

type Section = 'requests' | 'connections';

const CONVERSATION_AVATAR = 48;
const CONVERSATION_INSET = spacing.lg + CONVERSATION_AVATAR + spacing.md;

/** Your turn: their message is the latest, or nobody has written yet and you were the one who accepted. */
function isViewerTurn(c: Connection, viewerId: string): boolean {
  if (c.lastMessage) return c.lastMessage.senderId !== viewerId;
  return c.introducedBy !== 'viewer';
}

function preview(c: Connection, viewerId: string): string {
  if (c.lastMessage) return `${c.lastMessage.senderId === viewerId ? 'You: ' : ''}${c.lastMessage.body}`;
  return c.introducedBy === 'viewer' ? 'Accepted your introduction' : 'Say hello';
}

export default function Inbox() {
  const { colors } = useTheme();
  const router = useRouter();
  const { userId } = useMember();
  const { width } = useWindowDimensions();
  const [section, setSection] = useState<Section>('requests');
  const [incoming, setIncoming] = useState<IntroductionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<IntroductionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      const [inc, out, conns] = await Promise.all([api.introductions.listIncoming(userId), api.introductions.listOutgoing(userId), api.connections.list(userId)]);
      setIncoming(inc);
      setOutgoing(out);
      setConnections(conns);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);
  useRefreshOnFocus(load);
  useEffect(() => api.introductions.subscribeIncoming(userId, () => void load()), [userId, load]);
  const matchIds = useMemo(() => connections.map((c) => c.matchId), [connections]);
  useEffect(() => api.connections.subscribeInbox(matchIds, () => void load()), [matchIds, load]);

  const yourTurn = useMemo(() => connections.filter((c) => isViewerTurn(c, userId)), [connections, userId]);
  const theirTurn = useMemo(() => connections.filter((c) => !isViewerTurn(c, userId)), [connections, userId]);
  /** Unread messages plus fresh connections waiting on the viewer's first message. */
  const waiting = useMemo(() => connections.reduce((n, c) => n + c.unreadCount, 0) + yourTurn.filter((c) => !c.lastMessage).length, [connections, yourTurn]);

  const withdraw = async (req: IntroductionRequest) => {
    setBusy(req.id);
    try {
      await api.introductions.withdraw(req.id);
      setOutgoing((list) => list.filter((r) => r.id !== req.id));
    } catch (e) {
      Alert.alert('Could not withdraw', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const openProfile = (id: string) => router.push({ pathname: '/profile/[id]', params: { id } });
  const openChat = (matchId: string) => router.push({ pathname: '/chat/[matchId]', params: { matchId } });
  const cardWidth = cardWidthFor(width);

  const conversationRow = (c: Connection, yours: boolean) => (
    <InboxRow
      key={c.matchId}
      profile={c.counterpart}
      subtitle={preview(c, userId)}
      time={timeAgo(c.lastMessage?.createdAt ?? c.createdAt)}
      unread={c.unreadCount}
      emphasize={yours}
      avatarSize={CONVERSATION_AVATAR}
      onPress={() => openChat(c.matchId)}
      onAvatarPress={() => openProfile(c.counterpart.id)}
    />
  );

  return (
    <Screen>
      <Header title="Inbox" />
      <SegmentedTabs
        items={[
          { key: 'requests', label: 'Requests', badge: incoming.length },
          { key: 'connections', label: 'Connections', badge: waiting },
        ]}
        value={section}
        onChange={setSection}
      />
      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={colors.textSecondary} />}
        >
          <ErrorText message={error} />
          {section === 'requests' ? (
            <>
              {incoming.length === 0 ? (
                <EmptyState
                  icon="mail"
                  title="No requests yet"
                  body="When someone writes to you, their note and profile appear here first."
                  actionTitle="Explore people"
                  onAction={() => router.push('/explore')}
                />
              ) : (
                <View style={styles.grid}>
                  {incoming.map((req) => (
                    <PersonCard
                      key={req.id}
                      profile={req.counterpart}
                      width={cardWidth}
                      caption={`“${truncate(req.note, 80)}”`}
                      captionLines={2}
                      onPress={() => openProfile(req.counterpart.id)}
                    />
                  ))}
                </View>
              )}
              {outgoing.length > 0 ? (
                <>
                  <SectionHeader title="Sent by you" />
                  <Group inset={GROUP_INSET.avatar}>
                    {outgoing.map((req) => (
                      <InboxRow
                        key={req.id}
                        profile={req.counterpart}
                        subtitle={`Waiting · ${truncate(req.note, 60)}`}
                        time={timeAgo(req.createdAt)}
                        onPress={() => openProfile(req.counterpart.id)}
                        onAvatarPress={() => openProfile(req.counterpart.id)}
                      >
                        <View style={styles.actionsRight}>
                          <Button title="Withdraw" size="small" variant="ghost" onPress={() => withdraw(req)} loading={busy === req.id} />
                        </View>
                      </InboxRow>
                    ))}
                  </Group>
                </>
              ) : null}
            </>
          ) : connections.length === 0 ? (
            <EmptyState icon="message-circle" title="No conversations yet" body="Accepted introductions become conversations here." />
          ) : (
            <>
              {yourTurn.length > 0 ? (
                <CollapsibleSection title="Your turn" count={yourTurn.length}>
                  <Group inset={CONVERSATION_INSET}>{yourTurn.map((c) => conversationRow(c, true))}</Group>
                </CollapsibleSection>
              ) : null}
              {theirTurn.length > 0 ? (
                <CollapsibleSection title="Their turn" count={theirTurn.length} initiallyOpen={yourTurn.length === 0 || theirTurn.length <= 12}>
                  <Group inset={CONVERSATION_INSET}>{theirTurn.map((c) => conversationRow(c, false))}</Group>
                </CollapsibleSection>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, flexGrow: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, rowGap: 20, paddingHorizontal: PAGE_PADDING, paddingTop: PAGE_PADDING },
  actionsRight: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.xs },
});
