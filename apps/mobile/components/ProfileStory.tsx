import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { VERIFICATION_LABEL, nameAge, timeAgo, type Post, type PublicProfile } from '@peaches/core';
import { radius, spacing } from '@/constants/theme';
import { detailsFor, metaLineFor, vitalsFor } from '@/lib/profileCopy';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { GROUP_INSET, Group } from './Group';
import { HeaderIconButton } from './Header';
import { DetailRow, ProfilePhoto, ProfileSection, PullQuote, VitalsStrip } from './ProfileBlocks';
import { ChipRow, TagChip } from './TagChip';
import { VerificationBadge } from './VerificationBadge';

interface Props {
  profile: PublicProfile;
  /** Content width: the window minus the 16px side margins. */
  width: number;
  posts?: Post[];
  /** Rendered right after the identity block, e.g. the note of an incoming request. */
  afterIdentity?: React.ReactNode;
  /** Home leads with the name so the member knows who they are looking at before the first photo. */
  leadWithIdentity?: boolean;
  /** Tapping the name opens something (the full profile, on Home). */
  onPressIdentity?: () => void;
  /** A trailing "more" action on the identity row. */
  onMore?: () => void;
  /** Reports the identity block's y within the scroll content, for the header name fade. */
  onIdentityLayout?: (y: number) => void;
  /** The viewer is looking at their own profile. */
  own?: boolean;
}

/**
 * The profile as one vertical story: photos interleaved with the identity
 * block, bio card, vitals strip, details, interests, verification, and posts.
 * Returns a fragment of blocks; the parent scroll container spaces them (gap 16).
 */
export function ProfileStory({ profile, width, posts = [], afterIdentity, leadWithIdentity, onPressIdentity, onMore, onIdentityLayout, own }: Props) {
  const styles = useStyles(makeStyles);
  const { colors, text } = useTheme();
  const router = useRouter();
  const verified = profile.publicVerificationBadges.length > 0;
  const meta = metaLineFor(profile);
  const vitals = vitalsFor(profile);
  const details = detailsFor(profile);

  const photos: Array<string | null> = profile.photos.length > 0 ? profile.photos : [null];
  const photoBlock = (i: number) => <ProfilePhoto key={`photo-${i}`} uri={photos[i] ?? null} firstName={profile.firstName} index={i} width={width} />;

  const identity = (
    <View key="identity" style={styles.identity} onLayout={onIdentityLayout ? (e) => onIdentityLayout(e.nativeEvent.layout.y) : undefined}>
      <Pressable
        accessibilityRole={onPressIdentity ? 'button' : undefined}
        accessibilityLabel={onPressIdentity ? `Open ${profile.firstName}'s full profile` : undefined}
        onPress={onPressIdentity}
        disabled={!onPressIdentity}
        style={({ pressed }) => [styles.identityText, pressed && onPressIdentity && { opacity: 0.7 }]}
      >
        <View style={styles.nameRow}>
          <Text style={[text.title, styles.name]}>{nameAge(profile.firstName, profile.age)}</Text>
          {verified ? <VerificationBadge size={18} /> : null}
        </View>
        {meta ? <Text style={text.bodySecondary}>{meta}</Text> : null}
        {own ? <Text style={[text.caption, { marginTop: spacing.xs }]}>This is you, as other members see you.</Text> : null}
      </Pressable>
      {onMore ? <HeaderIconButton name="more-horizontal" label="More options" onPress={onMore} /> : null}
    </View>
  );

  /* Content blocks after the opening; the remaining photos are interleaved between them. */
  const later: React.ReactNode[] = [];
  if (vitals.length > 0) later.push(<VitalsStrip key="vitals" items={vitals} />);
  if (details.length > 0) {
    later.push(
      <Group key="details" inset={GROUP_INSET.icon}>
        {details.map((d) => (
          <DetailRow key={d.label} icon={d.icon} label={d.label} value={d.value} />
        ))}
      </Group>,
    );
  }
  if (profile.interests.length > 0) {
    later.push(
      <ProfileSection key="interests" title="Interests">
        <ChipRow>
          {profile.interests.map((i) => (
            <TagChip key={i} label={i} />
          ))}
        </ChipRow>
      </ProfileSection>,
    );
  }
  if (verified) {
    later.push(
      <ProfileSection key="verification" title="Verification">
        <View style={styles.verificationCard}>
          {profile.publicVerificationBadges.map((b) => (
            <VerificationBadge key={b} label={`${VERIFICATION_LABEL[b]} verified`} size={15} />
          ))}
          <Text style={[text.caption, { marginTop: spacing.xs }]}>Verified means our team reviewed the details this member provided.</Text>
        </View>
      </ProfileSection>,
    );
  }
  if (posts.length > 0) {
    later.push(
      <ProfileSection key="posts" title="Posts">
        <Group flush>
          {posts.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.postRow, pressed && { backgroundColor: colors.surfaceHover }]}
            >
              <Text style={text.body} numberOfLines={3}>
                {p.body}
              </Text>
              <Text style={text.micro}>{timeAgo(p.createdAt)}</Text>
            </Pressable>
          ))}
        </Group>
      </ProfileSection>,
    );
  }

  const blocks: React.ReactNode[] = leadWithIdentity ? [identity, photoBlock(0)] : [photoBlock(0), identity];
  if (afterIdentity) blocks.push(<React.Fragment key="after-identity">{afterIdentity}</React.Fragment>);
  if (profile.bio) blocks.push(<PullQuote key="bio" eyebrow={`About ${profile.firstName}`}>{profile.bio}</PullQuote>);
  let nextPhoto = 1;
  for (const block of later) {
    if (nextPhoto < photos.length) blocks.push(photoBlock(nextPhoto++));
    blocks.push(block);
  }
  while (nextPhoto < photos.length) blocks.push(photoBlock(nextPhoto++));

  return <>{blocks}</>;
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    identity: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
    identityText: { flex: 1, gap: spacing.xs },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: { flexShrink: 1 },
    verificationCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
    postRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 4 },
  });
