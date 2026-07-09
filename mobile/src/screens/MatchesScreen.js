// ─────────────────────────────────────────────────────────────────────────────
// MatchesScreen.js — everyone who has chosen you back. New matches (no
// messages yet) sit in a portrait strip up top; ongoing correspondences
// below with unread counts. Realtime: refreshes on new messages and on
// freshly opened matches.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Screen, ScreenHeader, Loading, Empty, Portrait, Label, Rule } from '../components/ui.js';
import { useAuth } from '../auth/AuthContext.js';
import { displayProfile } from '../lib/profile.js';
import { listCorrespondences, subscribeToInbox } from '../lib/chat.js';
import { subscribeToMatchStamps } from '../lib/swipes.js';
import { timeAgo } from '../lib/format.js';
import { colors, fonts, spacing } from '../theme.js';

export default function MatchesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [threads, setThreads] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const rows = await listCorrespondences(user.id);
      setThreads(rows.map(t => ({ ...t, other: displayProfile(t.other) })));
    } catch {
      setThreads(t => t ?? []);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const matchIdsKey = (threads || []).map(t => t.matchId).join(',');
  useEffect(() => {
    if (!threads?.length) return undefined;
    return subscribeToInbox(threads.map(t => t.matchId), load);
  }, [matchIdsKey]);

  useEffect(() => {
    if (!user?.id) return undefined;
    return subscribeToMatchStamps(user.id, load);
  }, [user?.id, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openChat = (matchId) => navigation.navigate('Chat', { matchId });

  if (threads === null) {
    return (
      <Screen>
        <ScreenHeader label="Matches" title="Your correspondences." />
        <Loading />
      </Screen>
    );
  }

  const fresh = threads.filter(t => !t.lastMessage);
  const ongoing = threads.filter(t => t.lastMessage);

  return (
    <Screen scroll refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader label="Matches" title="Your correspondences." />

      {threads.length === 0 ? (
        <Empty
          title="No matches yet."
          body="When you and another member choose each other, they appear here."
        />
      ) : (
        <>
          {fresh.length > 0 && (
            <View style={{ marginBottom: spacing(3) }}>
              <Label style={{ marginBottom: spacing(1.5) }}>New — say hello</Label>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {fresh.map(t => (
                  <Pressable key={t.matchId} onPress={() => openChat(t.matchId)} style={styles.freshItem}>
                    <Portrait profile={t.other} width={72} />
                    <Text style={styles.freshName} numberOfLines={1}>{t.other.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Rule style={{ marginTop: spacing(2) }} />
            </View>
          )}

          {ongoing.map(t => (
            <Pressable
              key={t.matchId}
              onPress={() => openChat(t.matchId)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            >
              <Portrait profile={t.other} width={52} />
              <View style={{ flex: 1, marginLeft: spacing(2) }}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName}>{t.other.name}</Text>
                  <Text style={styles.rowTime}>{timeAgo(t.lastMessage.created_at)}</Text>
                </View>
                <View style={styles.rowBottom}>
                  <Text
                    style={[styles.preview, t.unread > 0 && { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {t.lastMessage.sender_id === user.id ? 'You — ' : ''}
                    {t.lastMessage.body}
                  </Text>
                  {t.unread > 0 && (
                    <View style={styles.unreadDot}>
                      <Text style={styles.unreadCount}>{t.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  freshItem: {
    width: 72,
    marginRight: spacing(1.5),
  },
  freshName: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.text,
    marginTop: spacing(0.5),
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  rowName: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text,
  },
  rowTime: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.faint,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  preview: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.muted,
  },
  unreadDot: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: spacing(1),
  },
  unreadCount: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.bg,
  },
});
