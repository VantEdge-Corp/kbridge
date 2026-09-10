import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import type { Post } from '@peaches/core';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Loading } from '@/components/Loading';
import { PostCard } from '@/components/PostCard';
import { Screen } from '@/components/Screen';
import { spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

export default function Saved() {
  const router = useRouter();
  const { userId } = useMember();
  const [posts, setPosts] = useState<Post[] | null>(null);

  const load = useCallback(async () => {
    try {
      setPosts(await api.posts.listSaved(userId));
    } catch (e) {
      Alert.alert('Could not load saved posts', errorMessage(e));
      setPosts([]);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const unsave = async (post: Post) => {
    setPosts((list) => list?.filter((p) => p.id !== post.id) ?? null);
    try {
      await api.posts.setSaved(userId, post.id, false);
    } catch (e) {
      Alert.alert('Could not update', errorMessage(e));
      void load();
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title="Saved posts" />
      {posts === null ? (
        <Loading />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onOpen={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
              onAuthor={() => router.push({ pathname: '/profile/[id]', params: { id: item.author.id } })}
              onToggleSave={() => unsave(item)}
              onMore={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={posts.length === 0 ? styles.empty : styles.content}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          ListEmptyComponent={<EmptyState title="Nothing saved yet." body="Bookmark posts from the Feed to find them here." />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 40 },
  gap: { height: spacing.md },
});
