import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Extrapolation, FadeIn, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import type { PublicProfile } from '@peaches/core';
import { radius, spacing } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';
import { ProfileStory } from './ProfileStory';

interface Props {
  profile: PublicProfile;
  onPass: () => void;
  onInterested: () => void;
  onOpenProfile: () => void;
  onMore: () => void;
  /** Slides the card out to the left, then calls onPass. Home triggers this from the Not now button. */
  dismissSignal?: number;
}

const EXIT_DURATION = 220;
const FLING_VELOCITY = 900;

/**
 * One member at a time, as the full profile story. Drag left past the
 * threshold for "Not now", right for "Interested" (the card returns and the
 * note sheet opens). Vertical movement scrolls the story as usual.
 */
export function DiscoverCard({ profile, onPass, onInterested, onOpenProfile, onMore, dismissSignal = 0 }: Props) {
  const styles = useStyles(makeStyles);
  const { width } = useWindowDimensions();
  const threshold = width * 0.38;
  const x = useSharedValue(0);

  const onPassRef = useRef(onPass);
  onPassRef.current = onPass;
  const finishPass = () => onPassRef.current();

  useEffect(() => {
    if (dismissSignal > 0) x.value = withTiming(-width * 1.2, { duration: EXIT_DURATION }, () => runOnJS(finishPass)());
    // Only a new signal starts the exit; a changed callback identity must not replay it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissSignal]);

  const pan = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      x.value = e.translationX;
    })
    .onEnd((e) => {
      const flungLeft = e.velocityX < -FLING_VELOCITY;
      const flungRight = e.velocityX > FLING_VELOCITY;
      if (x.value < -threshold || flungLeft) {
        x.value = withTiming(-width * 1.2, { duration: EXIT_DURATION }, () => runOnJS(finishPass)());
      } else if (x.value > threshold || flungRight) {
        x.value = withSpring(0, { damping: 18, stiffness: 180 });
        runOnJS(onInterested)();
      } else {
        x.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  /* The story scrolls natively; the pan wins only once the drag is clearly horizontal, otherwise it fails and the scroll takes over. */
  const gesture = Gesture.Exclusive(pan, Gesture.Native());

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { rotate: `${interpolate(x.value, [-width, width], [-3, 3], Extrapolation.CLAMP)}deg` }],
  }));
  const passLabelStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-threshold, -24], [1, 0], Extrapolation.CLAMP) }));
  const interestedLabelStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [24, threshold], [0, 1], Extrapolation.CLAMP) }));

  return (
    <Animated.View style={[styles.card, cardStyle]} entering={FadeIn.duration(180)}>
      <GestureDetector gesture={gesture}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ProfileStory profile={profile} width={width - spacing.lg * 2} leadWithIdentity onPressIdentity={onOpenProfile} onMore={onMore} />
        </ScrollView>
      </GestureDetector>
      <Animated.View pointerEvents="none" style={[styles.label, styles.labelRight, passLabelStyle]}>
        <Text style={styles.labelText}>Not now</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.label, styles.labelLeft, interestedLabelStyle]}>
        <Text style={styles.labelText}>Interested</Text>
      </Animated.View>
    </Animated.View>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    card: { flex: 1, backgroundColor: colors.canvas },
    content: { paddingTop: spacing.sm, paddingBottom: 96, gap: spacing.lg },
    label: {
      position: 'absolute',
      top: spacing.lg,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.ivory,
    },
    labelLeft: { left: spacing.lg },
    labelRight: { right: spacing.lg },
    labelText: { fontSize: 13, fontWeight: '600', color: colors.onIvory },
  });
