import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { Post } from '@peaches/core';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorText } from '@/components/ErrorText';
import { Header } from '@/components/Header';
import { IntroductionNoteSheet } from '@/components/IntroductionNoteSheet';
import { Loading } from '@/components/Loading';
import { PostCard } from '@/components/PostCard';
import { ReportSheet } from '@/components/ReportSheet';
import { Screen } from '@/components/Screen';
import { ActionSheet } from '@/components/Sheet';
import { colors, spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

export default function Feed() {
  const router = useRouter();
  const { userId } = useMember();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState<Post | null>(null);
  const [more, setMore] = useState<Post | null>(null);
  const [report, setReport] = useState<Post | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      setPosts(await api.posts.listFeed(userId));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);
  useRefreshOnFocus(load);
  useEffect(() => api.posts.subscribeFeed(() => void load()), [load]);

  const toggleSave = useCallback(
    async (post: Post) => {
      const next = !post.savedByViewer;
      setPosts((list) => list?.map((p) => (p.id === post.id ? { ...p, savedByViewer: next } : p)) ?? null);
      try {
        await api.posts.setSaved(userId, post.id, next);
      } catch (e) {
        setPosts((list) => list?.map((p) => (p.id === post.id ? { ...p, savedByViewer: !next } : p)) ?? null);
        Alert.alert('Could not save', errorMessage(e));
      }
    },
    [userId],
  );

  const sendRequest = async (note: string) => {
    if (!request) return;
    await api.introductions.request({ viewerId: userId, recipientId: request.author.id, note, postId: request.id });
    setRequest(null);
    Alert.alert('Request sent', `${request.author.firstName} will see your note in their inbox.`);
  };

  const deletePost = (post: Post) => {
    Alert.alert('Delete this post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.posts.remove(post);
            setPosts((list) => list?.filter((p) => p.id !== post.id) ?? null);
          } catch (e) {
            Alert.alert('Could not delete', errorMessage(e));
          }
        },
      },
    ]);
  };

  const fileReport = async (reason: string) => {
    if (!report) return;
    try {
      await api.safety.report({ reporterId: userId, reportedId: report.author.id, reason, postId: report.id });
      Alert.alert('Report received', 'Our team will review it.');
    } catch (e) {
      Alert.alert('Could not report', errorMessage(e));
    } finally {
      setReport(null);
    }
  };

  const blockAuthor = (post: Post) => {
    Alert.alert(`Block ${post.author.firstName}?`, 'You will no longer see each other anywhere in Peaches.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.safety.block(userId, post.author.id);
            setPosts((list) => list?.filter((p) => p.author.id !== post.author.id) ?? null);
          } catch (e) {
            Alert.alert('Could not block', errorMessage(e));
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header title="Feed" right={<Button title="Post" size="small" icon="edit-2" onPress={() => router.push('/post/new')} />} />
      {posts === null && !error ? (
        <Loading />
      ) : error && !posts ? (
        <View style={styles.errorWrap}>
          <ErrorText message={error} />
          <Button title="Try again" variant="secondary" size="small" onPress={() => load()} />
        </View>
      ) : (
        <FlatList
          data={posts ?? []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onOpen={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
              onAuthor={() => router.push({ pathname: '/profile/[id]', params: { id: item.author.id } })}
              onToggleSave={() => toggleSave(item)}
              onRequestConversation={() => setRequest(item)}
              onMore={() => setMore(item)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={colors.textSecondary} />}
          contentContainerStyle={(posts?.length ?? 0) === 0 ? styles.emptyContent : styles.content}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          ListEmptyComponent={<EmptyState title="Nothing here yet." body="Share a plan, a question, or something you noticed around the city." actionTitle="Write a post" onAction={() => router.push('/post/new')} />}
        />
      )}

      <IntroductionNoteSheet
        visible={!!request}
        onClose={() => setRequest(null)}
        recipientFirstName={request?.author.firstName ?? ''}
        context={request ? `About their post: “${request.body.slice(0, 80)}${request.body.length > 80 ? '…' : ''}”` : undefined}
        onSubmit={sendRequest}
      />
      <ActionSheet
        visible={!!more}
        onClose={() => setMore(null)}
        actions={
          more?.own
            ? [{ label: 'Delete post', destructive: true, onPress: () => deletePost(more) }]
            : more
              ? [
                  { label: `View ${more.author.firstName}'s profile`, onPress: () => router.push({ pathname: '/profile/[id]', params: { id: more.author.id } }) },
                  { label: 'Report post', destructive: true, onPress: () => setReport(more) },
                  { label: `Block ${more.author.firstName}`, destructive: true, onPress: () => blockAuthor(more) },
                ]
              : []
        }
      />
      <ReportSheet visible={!!report} onClose={() => setReport(null)} onSelect={fileReport} title="Report this post" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 40 },
  gap: { height: spacing.md },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
});
