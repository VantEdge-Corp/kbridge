// ─────────────────────────────────────────────────────────────────────────────
// ChatScreen.js — one correspondence. Realtime inserts via the same
// postgres_changes channel the web app uses; messages the other member
// sends while the thread is open are marked read immediately.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable, KeyboardAvoidingView,
  Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Portrait, Loading, Rule, Label } from '../components/ui.js';
import { useAuth } from '../auth/AuthContext.js';
import { displayProfile } from '../lib/profile.js';
import {
  getCorrespondence, sendMessage, markCorrespondenceRead, subscribeToCorrespondence,
} from '../lib/chat.js';
import { messageTime } from '../lib/format.js';
import { colors, fonts, spacing } from '../theme.js';

export default function ChatScreen({ route, navigation }) {
  const { matchId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [convo, setConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const appendMessage = useCallback((msg) => {
    setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getCorrespondence(matchId, user.id);
        if (!alive) return;
        setConvo(data);
        setMessages(data?.messages || []);
        markCorrespondenceRead(matchId, user.id).catch(() => {});
      } catch {
        if (alive) setConvo(false);
      }
    })();
    return () => { alive = false; };
  }, [matchId, user.id]);

  useEffect(() => {
    return subscribeToCorrespondence(matchId, (msg) => {
      appendMessage(msg);
      if (msg.sender_id !== user.id) {
        markCorrespondenceRead(matchId, user.id).catch(() => {});
      }
    });
  }, [matchId, user.id, appendMessage]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(matchId, user.id, body);
      appendMessage(msg);
      setText('');
    } catch {
      // Keep the draft so nothing is lost.
    } finally {
      setSending(false);
    }
  };

  if (convo === null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Loading />
      </SafeAreaView>
    );
  }
  if (convo === false) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.introNote}>This correspondence could not be opened.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const other = displayProfile(convo.other);

  const renderItem = ({ item }) => {
    const mine = item.sender_id === user.id;
    return (
      <View style={[styles.bubbleRow, mine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={styles.bubbleText}>{item.body}</Text>
        </View>
        <Text style={styles.bubbleTime}>{messageTime(item.created_at)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ paddingRight: spacing(1.5) }}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Portrait profile={other} width={38} />
        <View style={{ marginLeft: spacing(1.5), flex: 1 }}>
          <Text style={styles.headerName}>{other?.name}</Text>
          <Text style={styles.headerMeta}>{other?.memberNumber}</Text>
        </View>
      </View>
      <Rule />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing(2.5), flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={convo.intro ? (
            <View style={styles.introBox}>
              <Label style={{ marginBottom: spacing(1) }}>
                {convo.intro.requester_id === user.id ? 'Your introduction' : 'Their introduction'}
              </Label>
              <Text style={styles.introNote}>“{convo.intro.note}”</Text>
            </View>
          ) : (
            <View style={styles.introBox}>
              <Label>A mutual interest — begin anywhere</Label>
            </View>
          )}
        />

        <Rule />
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom ? 0 : spacing(1), 0) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={`To ${other?.name || 'them'}…`}
            placeholderTextColor={colors.faint}
            multiline
            style={styles.composerInput}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            style={({ pressed }) => [
              styles.sendButton,
              (!text.trim() || sending) && { opacity: 0.35 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Feather name="send" size={18} color={colors.bg} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
  },
  headerName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  headerMeta: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.faint,
    marginTop: 2,
  },
  introBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing(2),
    marginBottom: spacing(2.5),
  },
  introNote: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  bubbleRow: {
    marginBottom: spacing(1.5),
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1.25),
    borderWidth: StyleSheet.hairlineWidth,
  },
  bubbleMine: {
    backgroundColor: 'rgba(196,149,108,0.12)',
    borderColor: 'rgba(196,149,108,0.35)',
  },
  bubbleTheirs: {
    backgroundColor: colors.raised,
    borderColor: colors.line,
  },
  bubbleText: {
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  bubbleTime: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: colors.faint,
    marginTop: 3,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1),
    gap: spacing(1.5),
  },
  composerInput: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing(1),
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(0.5),
  },
});
