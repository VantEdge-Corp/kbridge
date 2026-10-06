import { Image } from 'expo-image';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { timeAgo, type Post } from '@peaches/core';
import { PAGE_PADDING } from '@/constants/layout';
import { avatar, radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
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
  /** The ⋯ menu; a long-press on the card opens it too, as right-click does on the web. */
  onMore: () => void;
  /** Hide the open/comment affordance when already on the post screen. */
  detail?: boolean;
}

const CARD_PADDING = spacing.lg;

/** A post in a shadcn Card: author, text, an optional photo, quiet actions. No follower counts, no public popularity. */
export const PostCard = memo(function PostCard({ post, onOpen, onAuthor, onToggleSave, onRequestConversation, onMore, detail }: Props) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  const { width } = useWindowDimensions();
  const imageWidth = width - PAGE_PADDING * 2 - CARD_PADDING * 2 - 2;
  return (
    <Pressable onLongPress={onMore} delayLongPress={350} accessibilityHint="Long press for post options" style={styles.card}>
      <View style={styles.head}>
        <Pressable onPress={onAuthor} accessibilityRole="button" accessibilityLabel={`Open ${post.author.firstName}'s profile`} style={styles.author}>
          <Avatar uri={post.author.photos[0] ?? null} firstName={post.author.firstName} size={avatar.feed} />
          <View style={styles.authorText}>
            <View style={styles.nameRow}>
              <Text style={[text.body, styles.name]} numberOfLines={1}>
                {post.author.firstName}
              </Text>
              {post.author.publicVerificationBadges.length > 0 ? <VerificationBadge size={14} /> : null}
            </View>
            <Text style={text.caption}>
              {post.author.displayArea} · {timeAgo(post.createdAt)}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={onMore} accessibilityRole="button" accessibilityLabel="Post options" hitSlop={8} style={({ pressed }) => [styles.more, pressed && { backgroundColor: colors.accent }]}>
          <Icon name="ellipsis" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <Pressable onPress={detail ? undefined : onOpen} onLongPress={onMore} delayLongPress={350} disabled={detail} accessibilityRole={detail ? undefined : 'button'}>
        <Text style={[text.body, styles.body]}>{post.body}</Text>
        {post.photoUrl ? (
          <Image source={{ uri: post.photoUrl }} style={[styles.photo, { width: imageWidth, height: Math.round((imageWidth * 3) / 4) }]} contentFit="cover" transition={150} />
        ) : null}
      </Pressable>
      <View style={styles.actions}>
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${post.commentCount} comments`} style={styles.action} hitSlop={6}>
          <Icon name="message-circle" size={20} color={colors.mutedForeground} />
          {post.commentCount > 0 ? <Text style={text.bodySmall}>{post.commentCount}</Text> : null}
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          accessibilityRole="button"
          accessibilityLabel={post.savedByViewer ? 'Remove from saved' : 'Save'}
          accessibilityState={{ selected: post.savedByViewer }}
          style={styles.action}
          hitSlop={6}
        >
          <Icon name={post.savedByViewer ? 'bookmark-check' : 'bookmark'} size={20} color={post.savedByViewer ? colors.foreground : colors.mutedForeground} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {onRequestConversation && !post.own ? (
          <Button title="Request conversation" icon="message-square-text" variant="ghost" size="sm" onPress={onRequestConversation} style={styles.request} />
        ) : null}
      </View>
    </Pressable>
  );
});

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    card: {
      padding: CARD_PADDING,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xl,
      gap: spacing.md,
    },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    author: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    authorText: { flexShrink: 1, gap: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    name: { fontWeight: '600' },
    more: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
    body: { color: colors.foreground },
    photo: { marginTop: spacing.md, borderRadius: radius.lg, backgroundColor: colors.muted, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.imageRing },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: 2 },
    action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
    request: { marginRight: -spacing.md },
  });
