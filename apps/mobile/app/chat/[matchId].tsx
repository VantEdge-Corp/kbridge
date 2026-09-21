import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messageTime, type Connection, type Message } from '@peaches/core';
import { Avatar } from '@/components/Avatar';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Loading } from '@/components/Loading';
import { ReportSheet } from '@/components/ReportSheet';
import { Screen } from '@/components/Screen';
import { ActionSheet } from '@/components/Sheet';
import { radius, spacing, touch } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

export default function Chat() {
  const styles = useStyles(makeStyles);
  const { colors, text, isDark } = useTheme();
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { userId } = useMember();
  const insets = useSafeAreaInsets();
  const [connection, setConnection] = useState<Connection | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    if (!matchId) return;
    try {
      const result = await api.connections.get(matchId, userId);
      if (!result) {
        setConnection(null);
        return;
      }
      setConnection(result.connection);
      setMessages(result.messages);
      void api.connections.markRead(matchId, userId);
    } catch (e) {
      Alert.alert('Could not open conversation', errorMessage(e));
      setConnection(null);
    }
  }, [matchId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!matchId) return;
    return api.connections.subscribeConversation(matchId, (message) => {
      setMessages((list) => (list.some((m) => m.id === message.id) ? list : [...list, message]));
      if (message.senderId !== userId) void api.connections.markRead(matchId, userId);
    });
  }, [matchId, userId]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !matchId) return;
    setSending(true);
    try {
      const message = await api.connections.send(matchId, userId, body);
      setMessages((list) => (list.some((m) => m.id === message.id) ? list : [...list, message]));
      setDraft('');
    } catch (e) {
      Alert.alert('Not sent', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const inverted = useMemo(() => [...messages].reverse(), [messages]);
  const other = connection?.counterpart;

  const block = () => {
    if (!other) return;
    Alert.alert(`Block ${other.firstName}?`, 'This conversation closes and you will no longer see each other.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.safety.block(userId, other.id);
            router.back();
          } catch (e) {
            Alert.alert('Could not block', errorMessage(e));
          }
        },
      },
    ]);
  };

  const fileReport = async (reason: string) => {
    if (!other) return;
    try {
      await api.safety.report({ reporterId: userId, reportedId: other.id, reason, matchId });
      Alert.alert('Report received', 'Our team will review it.');
    } catch (e) {
      Alert.alert('Could not report', errorMessage(e));
    } finally {
      setReportOpen(false);
    }
  };

  if (connection === undefined) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back />
        <Loading />
      </Screen>
    );
  }
  if (!connection || !other) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Header back />
        <View style={styles.center}>
          <Text style={text.bodySecondary}>This conversation could not be opened.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Header
            back
            right={
              <Pressable accessibilityRole="button" accessibilityLabel="More options" onPress={() => setMoreOpen(true)} style={styles.more} hitSlop={6}>
                <Icon name="more-horizontal" size={20} color={colors.textSecondary} />
              </Pressable>
            }
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${other.firstName}'s profile`}
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: other.id } })}
            style={styles.person}
          >
            <Avatar uri={other.photos[0] ?? null} firstName={other.firstName} size={28} />
            <Text style={[text.name, { fontSize: 18 }]}>{other.firstName}</Text>
            <Text style={text.caption}>{other.displayArea}</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={inverted}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const mine = item.senderId === userId;
            const next = inverted[index - 1];
            const showTime = !next || next.senderId !== item.senderId || Date.parse(next.createdAt) - Date.parse(item.createdAt) > 5 * 60_000;
            return (
              <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={text.body}>{item.body}</Text>
                </View>
                {showTime ? <Text style={[text.micro, styles.time, mine && { textAlign: 'right' }]}>{messageTime(item.createdAt)}</Text> : null}
              </View>
            );
          }}
          ListFooterComponent={
            connection.introductionNote ? (
              <View style={styles.intro}>
                <Text style={text.eyebrow}>{connection.introducedBy === 'viewer' ? 'Your introduction' : `${other.firstName}'s introduction`}</Text>
                <Text style={[text.bodySecondary, { marginTop: 6 }]}>{connection.introductionNote}</Text>
              </View>
            ) : (
              <View style={styles.intro}>
                <Text style={text.caption}>You are connected. Begin anywhere.</Text>
              </View>
            )
          }
          keyboardDismissMode="interactive"
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={`Message ${other.firstName}`}
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.input}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            accessibilityLabel="Message"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={send}
            disabled={!draft.trim() || sending}
            style={[styles.send, (!draft.trim() || sending) && { opacity: 0.4 }]}
          >
            <Icon name="send" size={16} color={colors.onIvory} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ActionSheet
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        actions={[
          { label: `View ${other.firstName}'s profile`, onPress: () => router.push({ pathname: '/profile/[id]', params: { id: other.id } }) },
          { label: 'Report', destructive: true, onPress: () => setReportOpen(true) },
          { label: `Block ${other.firstName}`, destructive: true, onPress: block },
        ]}
      />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} onSelect={fileReport} title={`Report ${other.firstName}`} />
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  header: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  more: { width: touch.minTarget, height: touch.minTarget, alignItems: 'flex-end', justifyContent: 'center' },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 36 },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: 6 },
  bubbleRow: { alignItems: 'flex-start', maxWidth: '82%' },
  bubbleRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg },
  bubbleMine: { backgroundColor: colors.surfaceElevated, borderBottomRightRadius: radius.sm },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: radius.sm },
  time: { marginTop: 3, paddingHorizontal: 4 },
  intro: { marginBottom: spacing.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.canvas },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, color: colors.text, fontSize: 15, lineHeight: 20 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' },
});
