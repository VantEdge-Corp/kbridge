import { Image } from 'expo-image';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { timeAgo, type Post } from '@peaches/core';
import { PAGE_PADDING } from '@/constants/layout';
import { avatar, colors, radius, spacing, text } from '@/constants/theme';
import { Avatar } from './Avatar';
import { Button } from './Button';
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

const CARD_PADDING = spacing.lg;

/** A grouped card: 36px avatar, text, optional photo, thin 20px action icons. No follower counts, no public popularity, no viral metrics. */
export const PostCard = memo(function PostCard({ post, onOpen, onAuthor, onToggleSave, onRequestConversation, onMore, detail }: Props) {
  const { width } = useWindowDimensions();
  const imageWidth = width - PAGE_PADDING * 2 - CARD_PADDING * 2 - 2;
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
          <Icon name="message-circle" size={20} color={colors.textSecondary} />
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
          <Icon name="bookmark" size={20} color={post.savedByViewer ? colors.ivory : colors.textSecondary} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {onRequestConversation && !post.own ? (
          <Button title="Request conversation" icon="mail" variant="ghost" size="small" onPress={onRequestConversation} style={styles.request} />
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: CARD_PADDING,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, flex: 1 },
  authorText: { flexShrink: 1, gap: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  more: { width: 36, height: 36, alignItems: 'flex-end', justifyContent: 'center' },
  body: { color: colors.text },
  photo: { marginTop: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceElevated },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  request: { marginRight: -spacing.md },
});
