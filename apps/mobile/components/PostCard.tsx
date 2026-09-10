import { Image } from 'expo-image';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { timeAgo, type Post } from '@peaches/core';
import { PAGE_PADDING } from '@/constants/layout';
import { avatar, colors, radius, spacing, text } from '@/constants/theme';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { VerificationBadge } from './VerificationBadge';

interface Props {
  post: Post;
  onOpen: () => void;
  onAuthor: () => void;
  onToggleSave: () => void;
  onRequestConversation?: () => void;
  onMore: () => void;
  /** Hide the open/comment affordance when already on the post screen. */
  detail?: boolean;
}

/** No follower counts, no public popularity, no viral metrics. */
export const PostCard = memo(function PostCard({ post, onOpen, onAuthor, onToggleSave, onRequestConversation, onMore, detail }: Props) {
  const { width } = useWindowDimensions();
  const imageWidth = width - PAGE_PADDING * 2;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Pressable onPress={onAuthor} accessibilityRole="button" accessibilityLabel={`Open ${post.author.firstName}'s profile`} style={styles.author}>
          <Avatar uri={post.author.photos[0] ?? null} firstName={post.author.firstName} size={avatar.feed} />
          <View style={styles.authorText}>
            <View style={styles.nameRow}>
              <Text style={[text.body, { fontWeight: '500' }]} numberOfLines={1}>
                {post.author.firstName}
              </Text>
              {post.author.publicVerificationBadges.length > 0 ? <VerificationBadge size={13} /> : null}
            </View>
            <Text style={text.micro}>
              {post.author.displayArea} · {timeAgo(post.createdAt)}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={onMore} accessibilityRole="button" accessibilityLabel="More options" hitSlop={8} style={styles.more}>
          <Icon name="more-horizontal" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
      <Pressable onPress={detail ? undefined : onOpen} disabled={detail} accessibilityRole={detail ? undefined : 'button'}>
        <Text style={[text.body, styles.body]}>{post.body}</Text>
        {post.photoUrl ? (
          <Image source={{ uri: post.photoUrl }} style={[styles.photo, { width: imageWidth, height: Math.round((imageWidth * 3) / 4) }]} contentFit="cover" transition={150} />
        ) : null}
      </Pressable>
      <View style={styles.actions}>
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${post.commentCount} comments`} style={styles.action} hitSlop={6}>
          <Icon name="message-circle" size={18} color={colors.textSecondary} />
          {post.commentCount > 0 ? <Text style={text.caption}>{post.commentCount}</Text> : null}
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          accessibilityRole="button"
          accessibilityLabel={post.savedByViewer ? 'Remove from saved' : 'Save'}
          accessibilityState={{ selected: post.savedByViewer }}
          style={styles.action}
          hitSlop={6}
        >
          <Icon name="bookmark" size={18} color={post.savedByViewer ? colors.ivory : colors.textSecondary} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {onRequestConversation && !post.own ? (
          <Pressable onPress={onRequestConversation} accessibilityRole="button" style={({ pressed }) => [styles.request, pressed && { opacity: 0.7 }]}>
            <Text style={styles.requestText}>Request conversation</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { paddingHorizontal: PAGE_PADDING, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  authorText: { flexShrink: 1, gap: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  more: { width: 36, height: 36, alignItems: 'flex-end', justifyContent: 'center' },
  body: { color: colors.text },
  photo: { marginTop: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surfaceElevated },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 },
  request: { minHeight: 32, justifyContent: 'center' },
  requestText: { fontSize: 13, color: colors.ivory, fontWeight: '500' },
});
