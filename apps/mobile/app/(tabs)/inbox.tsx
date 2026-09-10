import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { timeAgo, truncate, type Connection, type IntroductionRequest } from '@peaches/core';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorText } from '@/components/ErrorText';
import { GROUP_INSET, Group } from '@/components/Group';
import { Header } from '@/components/Header';
import { InboxRow } from '@/components/InboxRow';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { colors, spacing, text } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

type Section = 'requests' | 'connections' | 'messages';

export default function Inbox() {
  const router = useRouter();
  const { userId } = useMember();
  const [section, setSection] = useState<Section>('requests');
  const [incoming, setIncoming] = useState<IntroductionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<IntroductionRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
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

  const fresh = useMemo(() => connections.filter((c) => !c.lastMessage), [connections]);
  const threads = useMemo(() => connections.filter((c) => !!c.lastMessage), [connections]);
  const unreadTotal = useMemo(() => threads.reduce((n, c) => n + c.unreadCount, 0), [threads]);

  const accept = async (req: IntroductionRequest) => {
    setBusy(req.id);
    try {
      const matchId = await api.introductions.accept(req.id);
      setIncoming((list) => list.filter((r) => r.id !== req.id));
      router.push({ pathname: '/chat/[matchId]', params: { matchId } });
      void load();
    } catch (e) {
      Alert.alert('Could not accept', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const decline = async (req: IntroductionRequest) => {
    setBusy(req.id);
    try {
      await api.introductions.decline(req.id);
      setIncoming((list) => list.filter((r) => r.id !== req.id));
    } catch (e) {
      Alert.alert('Could not decline', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

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

  return (
    <Screen>
      <Header title="Inbox" />
      <SegmentedTabs
        items={[
          { key: 'requests', label: 'Requests', badge: incoming.length },
          { key: 'connections', label: 'Connections', badge: fresh.length },
          { key: 'messages', label: 'Messages', badge: unreadTotal },
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
                <EmptyState title="No requests waiting." body="When someone writes to you, their note appears here first." />
              ) : (
                <Group inset={GROUP_INSET.avatar} style={styles.group}>
                  {incoming.map((req) => (
                    <InboxRow
                      key={req.id}
                      profile={req.counterpart}
                      subtitle={expanded === req.id ? 'Tap to collapse' : truncate(req.note, 70)}
                      time={timeAgo(req.createdAt)}
                      emphasize
                      onPress={() => setExpanded(expanded === req.id ? null : req.id)}
                      onAvatarPress={() => openProfile(req.counterpart.id)}
                    >
                      {expanded === req.id ? (
                        <View style={styles.expanded}>
                          <Text style={text.body}>{req.note}</Text>
                          <View style={styles.actions}>
                            <Button title="Accept" size="small" onPress={() => accept(req)} loading={busy === req.id} />
                            <Button title="Decline" size="small" variant="ghost" onPress={() => decline(req)} disabled={busy === req.id} />
                            <View style={{ flex: 1 }} />
                            <Button title="View profile" size="small" variant="ghost" onPress={() => openProfile(req.counterpart.id)} />
                          </View>
                        </View>
                      ) : null}
                    </InboxRow>
                  ))}
                </Group>
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
          ) : section === 'connections' ? (
            fresh.length === 0 ? (
              <EmptyState title="No new connections." body="Accepted introductions land here until the first message." />
            ) : (
              <Group inset={GROUP_INSET.avatar} style={styles.group}>
                {fresh.map((c) => (
                  <InboxRow
                    key={c.matchId}
                    profile={c.counterpart}
                    subtitle={c.introducedBy === 'viewer' ? 'They accepted your introduction · Say hello' : 'You accepted their introduction · Say hello'}
                    time={timeAgo(c.createdAt)}
                    emphasize
                    onPress={() => openChat(c.matchId)}
                    onAvatarPress={() => openProfile(c.counterpart.id)}
                  />
                ))}
              </Group>
            )
          ) : threads.length === 0 ? (
            <EmptyState title="No conversations yet." />
          ) : (
            <Group inset={GROUP_INSET.avatar} style={styles.group}>
              {threads.map((c) => (
                <InboxRow
                  key={c.matchId}
                  profile={c.counterpart}
                  subtitle={`${c.lastMessage?.senderId === userId ? 'You: ' : ''}${c.lastMessage?.body ?? ''}`}
                  time={c.lastMessage ? timeAgo(c.lastMessage.createdAt) : undefined}
                  unread={c.unreadCount}
                  emphasize={c.unreadCount > 0}
                  onPress={() => openChat(c.matchId)}
                  onAvatarPress={() => openProfile(c.counterpart.id)}
                />
              ))}
            </Group>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, flexGrow: 1 },
  group: { marginTop: spacing.md },
  expanded: { marginTop: spacing.md, paddingLeft: 40 + spacing.md, gap: spacing.md },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: -(40 + spacing.md) },
  actionsRight: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.xs },
});
