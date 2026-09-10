import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIMITS, timeAgo, type Post, type PostComment } from '@peaches/core';
import { Avatar } from '@/components/Avatar';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { IntroductionNoteSheet } from '@/components/IntroductionNoteSheet';
import { Loading } from '@/components/Loading';
import { PostCard } from '@/components/PostCard';
import { ReportSheet } from '@/components/ReportSheet';
import { Screen } from '@/components/Screen';
import { ActionSheet } from '@/components/Sheet';
import { colors, radius, spacing, text } from '@/constants/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

export default function PostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useMember();
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [request, setRequest] = useState(false);
  const [more, setMore] = useState(false);
  const [report, setReport] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [feed, list] = await Promise.all([api.posts.listFeed(userId, { limit: 200 }), api.posts.listComments(id)]);
      setPost(feed.find((p) => p.id === id) ?? null);
      setComments(list);
    } catch (e) {
      Alert.alert('Could not load post', errorMessage(e));
      setPost(null);
    }
  }, [id, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!id || !draft.trim()) return;
    setSending(true);
    try {
      await api.posts.addComment(userId, id, draft);
      setDraft('');
      setComments(await api.posts.listComments(id));
      setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p));
    } catch (e) {
      Alert.alert('Not sent', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const toggleSave = async () => {
    if (!post) return;
    const next = !post.savedByViewer;
    setPost({ ...post, savedByViewer: next });
    try {
      await api.posts.setSaved(userId, post.id, next);
    } catch (e) {
      setPost({ ...post, savedByViewer: !next });
      Alert.alert('Could not save', errorMessage(e));
    }
  };

  const sendRequest = async (note: string) => {
    if (!post) return;
    await api.introductions.request({ viewerId: userId, recipientId: post.author.id, note, postId: post.id });
    setRequest(false);
    Alert.alert('Request sent', `${post.author.firstName} will see your note in their inbox.`);
  };

  const fileReport = async (reason: string) => {
    if (!post) return;
    try {
      await api.safety.report({ reporterId: userId, reportedId: post.author.id, reason, postId: post.id });
      Alert.alert('Report received', 'Our team will review it.');
    } catch (e) {
      Alert.alert('Could not report', errorMessage(e));
    } finally {
      setReport(false);
    }
  };

  const deletePost = () => {
    if (!post) return;
    Alert.alert('Delete this post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.posts.remove(post);
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', errorMessage(e));
          }
        },
      },
    ]);
  };

  if (post === undefined) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back title="Post" />
        <Loading />
      </Screen>
    );
  }
  if (!post) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back title="Post" />
        <View style={styles.center}>
          <Text style={text.bodySecondary}>This post isn&apos;t available.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Header back title="Post" />
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.cardWrap}>
          <PostCard
            post={post}
            detail
            onOpen={() => {}}
            onAuthor={() => router.push({ pathname: '/profile/[id]', params: { id: post.author.id } })}
            onToggleSave={toggleSave}
            onRequestConversation={() => setRequest(true)}
            onMore={() => setMore(true)}
          />
          </View>
          <View style={styles.comments}>
            <Text style={text.eyebrow}>{comments.length === 0 ? 'No comments yet' : `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}</Text>
            {comments.map((c) => (
              <View key={c.id} style={styles.comment}>
                <Pressable onPress={() => router.push({ pathname: '/profile/[id]', params: { id: c.author.id } })} accessibilityRole="button" accessibilityLabel={`Open ${c.author.firstName}'s profile`}>
                  <Avatar uri={c.author.photos[0] ?? null} firstName={c.author.firstName} size={28} />
                </Pressable>
                <View style={styles.commentBody}>
                  <View style={styles.commentHead}>
                    <Text style={[text.bodySmall, { color: colors.text, fontWeight: '500' }]}>{c.author.firstName}</Text>
                    <Text style={text.micro}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <Text style={text.body}>{c.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a comment"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={LIMITS.commentBodyMax}
            style={styles.input}
            keyboardAppearance="dark"
            accessibilityLabel="Comment"
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Send comment" onPress={send} disabled={!draft.trim() || sending} style={[styles.send, (!draft.trim() || sending) && { opacity: 0.4 }]}>
            <Icon name="send" size={16} color={colors.onIvory} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <IntroductionNoteSheet visible={request} onClose={() => setRequest(false)} recipientFirstName={post.author.firstName} context="About their post" onSubmit={sendRequest} />
      <ActionSheet
        visible={more}
        onClose={() => setMore(false)}
        actions={
          post.own
            ? [{ label: 'Delete post', destructive: true, onPress: deletePost }]
            : [{ label: 'Report post', destructive: true, onPress: () => setReport(true) }]
        }
      />
      <ReportSheet visible={report} onClose={() => setReport(false)} onSelect={fileReport} title="Report this post" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  body: { paddingBottom: spacing.xl },
  cardWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  comments: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.md },
  comment: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  commentBody: { flex: 1, gap: 2 },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.canvas },
  input: { flex: 1, minHeight: 44, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, color: colors.text, fontSize: 15, lineHeight: 20 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' },
});
