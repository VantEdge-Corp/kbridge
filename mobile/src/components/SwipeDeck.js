// ─────────────────────────────────────────────────────────────────────────────
// SwipeDeck.js — the Discover deck: drag the top portrait right to like,
// left to pass, or use the buttons beneath. Hand-rolled with PanResponder +
// Animated (no native gesture deps, runs in Expo Go).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useRef } from 'react';
import {
  View, Text, Animated, PanResponder, Pressable, StyleSheet, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Portrait } from './ui.js';
import { colors, fonts, spacing } from '../theme.js';

const SWIPE_OUT_DURATION = 240;

function SwipeCard({ profile }) {
  return (
    <View style={styles.card}>
      <Portrait profile={profile} width="100%" ratio={undefined} style={StyleSheet.absoluteFill} fontSize={120} />
      <Text style={styles.memberNumber}>{profile.memberNumber}</Text>
      <LinearGradient
        colors={['transparent', 'rgba(14,13,11,0.55)', colors.bg]}
        locations={[0, 0.55, 1]}
        style={styles.cardFade}
      >
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {profile.name}
            {profile.age ? <Text style={styles.age}>, {profile.age}</Text> : null}
          </Text>
          {profile.identityVerified ? <Feather name="shield" size={16} color={colors.accent} /> : null}
        </View>
        {(profile.city || profile.occupation) ? (
          <Text style={styles.meta}>
            {[profile.city, profile.occupation].filter(Boolean).join('  ·  ')}
          </Text>
        ) : null}
        {profile.education ? <Text style={styles.education}>{profile.education}</Text> : null}
        {profile.bio ? (
          <Text style={styles.bio} numberOfLines={3}>{profile.bio}</Text>
        ) : null}
      </LinearGradient>
    </View>
  );
}

export default function SwipeDeck({ profile, nextProfile, onSwipe }) {
  const { width } = useWindowDimensions();
  const pan = useRef(new Animated.ValueXY()).current;
  const animating = useRef(false);

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    animating.current = false;
  }, [profile?.id]);

  const threshold = width * 0.28;

  const forceSwipe = (direction) => {
    if (animating.current || !profile) return;
    animating.current = true;
    const toX = (direction === 'like' ? 1 : -1) * width * 1.4;
    Animated.timing(pan, {
      toValue: { x: toX, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onSwipe(direction, profile);
        pan.setValue({ x: 0, y: 0 });
        animating.current = false;
      }
    });
  };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => {
      if (animating.current) return;
      pan.setValue({ x: g.dx, y: g.dy * 0.3 });
    },
    onPanResponderRelease: (_, g) => {
      if (animating.current) return;
      if (g.dx > threshold) forceSwipe('like');
      else if (g.dx < -threshold) forceSwipe('pass');
      else {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
    },
  }), [profile?.id, width]);

  const rotate = pan.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-9deg', '0deg', '9deg'],
  });
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, threshold], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const passOpacity = pan.x.interpolate({
    inputRange: [-threshold, 0], outputRange: [1, 0], extrapolate: 'clamp',
  });
  const nextScale = pan.x.interpolate({
    inputRange: [-width, 0, width], outputRange: [1, 0.95, 1], extrapolate: 'clamp',
  });

  if (!profile) return null;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {nextProfile ? (
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: nextScale }] }]}>
            <SwipeCard profile={nextProfile} />
          </Animated.View>
        ) : null}

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
          ]}
        >
          <SwipeCard profile={profile} />
          <Animated.View style={[styles.stamp, styles.stampLike, { opacity: likeOpacity }]}>
            <Text style={[styles.stampText, { color: colors.accent }]}>Interested</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampPass, { opacity: passOpacity }]}>
            <Text style={[styles.stampText, { color: colors.danger }]}>Pass</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={() => forceSwipe('pass')}
          style={({ pressed }) => [styles.controlButton, { borderColor: `${colors.dangerDim}99` }, pressed && { opacity: 0.6 }]}
        >
          <Feather name="x" size={24} color={colors.danger} />
        </Pressable>
        <Pressable
          onPress={() => forceSwipe('like')}
          style={({ pressed }) => [styles.controlButton, { borderColor: colors.accent }, pressed && { opacity: 0.6 }]}
        >
          <Feather name="heart" size={22} color={colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.raised,
  },
  memberNumber: {
    position: 'absolute',
    top: spacing(2),
    right: spacing(2),
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(232,224,208,0.55)',
  },
  cardFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing(2.5),
    paddingTop: spacing(8),
    paddingBottom: spacing(2.5),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.text,
  },
  age: {
    fontStyle: 'italic',
    color: colors.accentBright,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: spacing(1),
  },
  education: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing(0.5),
  },
  bio: {
    fontFamily: fonts.display,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(232,224,208,0.85)',
    marginTop: spacing(1.5),
  },
  stamp: {
    position: 'absolute',
    top: spacing(3),
    borderWidth: 1.5,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
  },
  stampLike: {
    left: spacing(2.5),
    borderColor: colors.accent,
    transform: [{ rotate: '-12deg' }],
  },
  stampPass: {
    right: spacing(2.5),
    borderColor: colors.danger,
    transform: [{ rotate: '12deg' }],
  },
  stampText: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 22,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(4),
    paddingTop: spacing(2.5),
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
