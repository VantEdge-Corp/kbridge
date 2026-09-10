import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { longDate, type ApplicationStatusRecord, type PublicApplicationStatus } from '@peaches/core';
import { Button } from '@/components/Button';
import { ErrorText } from '@/components/ErrorText';
import { Field } from '@/components/Field';
import { Header } from '@/components/Header';
import { Icon, type IconName } from '@/components/Icon';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, text } from '@/constants/theme';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { loadStatusToken, saveStatusToken } from '@/lib/storage';

const VIEW: Record<PublicApplicationStatus, { icon: IconName; eyebrow: string; title: string; body: string }> = {
  pending: { icon: 'clock', eyebrow: 'Under review', title: 'Your application is with the committee.', body: 'Applications are read by a person, typically within a few days. Check back here any time.' },
  waitlisted: { icon: 'clock', eyebrow: 'Deferred', title: "We'd like a bit more time.", body: 'Your application is still open. We will revisit it as the community grows.' },
  approved: { icon: 'check-circle', eyebrow: 'Admitted', title: 'Welcome.', body: 'Create your account to join the community.' },
  claimed: { icon: 'check', eyebrow: 'Active member', title: "You're a member.", body: 'Sign in with your email and password.' },
};

export default function Status() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; submitted?: string }>();
  const [input, setInput] = useState(params.token ?? '');
  const [token, setToken] = useState<string | null>(params.token ?? null);
  const [record, setRecord] = useState<ApplicationStatusRecord | null>(null);
  const [loading, setLoading] = useState(!!params.token);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.token) {
      setInput(params.token);
      setToken(params.token);
      return;
    }
    void loadStatusToken().then((saved) => {
      if (saved) setInput((current) => current || saved);
    });
  }, [params.token]);

  const lookup = useCallback(async (value: string) => {
    setLoading(true);
    setError(null);
    setRecord(null);
    try {
      const found = await api.applications.status(value);
      if (!found) {
        setError("We couldn't find that application.");
      } else {
        setRecord(found);
        await saveStatusToken(value);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void lookup(token);
  }, [token, lookup]);

  const reset = () => {
    setToken(null);
    setRecord(null);
    setError(null);
  };

  const view = record ? VIEW[record.status] : null;

  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title="Application status" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!token ? (
          <>
            <Text style={text.bodySmall}>Enter the reference token you received when you applied.</Text>
            <Field label="Reference token" value={input} onChangeText={setInput} autoCapitalize="none" autoCorrect={false} placeholder="e.g. 3f9c…" />
            <Button title="Check status" onPress={() => setToken(input.trim())} disabled={!input.trim()} fullWidth />
          </>
        ) : loading || (!record && !error) ? (
          <Loading />
        ) : error ? (
          <>
            <ErrorText message={error} />
            <Button title="Try another token" variant="secondary" onPress={reset} fullWidth />
            <Button title="Submit a new application" variant="ghost" onPress={() => router.replace('/(auth)/apply')} fullWidth />
          </>
        ) : record && view ? (
          <>
            {params.submitted ? (
              <View style={styles.tokenBox}>
                <Text style={text.eyebrow}>Application received. Keep this token</Text>
                <Text selectable style={styles.token}>
                  {token}
                </Text>
                <Text style={text.caption}>It is saved on this phone, but write it down too. It is the only way to check your status or claim your account.</Text>
              </View>
            ) : null}
            <View style={styles.statusRow}>
              <Icon name={view.icon} size={18} color={record.status === 'approved' || record.status === 'claimed' ? colors.verified : colors.textSecondary} />
              <Text style={text.eyebrow}>{view.eyebrow}</Text>
            </View>
            <Text style={text.title}>
              {record.firstName}, {view.title.charAt(0).toLowerCase() + view.title.slice(1)}
            </Text>
            <Text style={text.bodySecondary}>{view.body}</Text>
            <Text style={text.caption}>Submitted {longDate(record.createdAt)}</Text>
            {record.status === 'approved' ? <Button title="Create your account" onPress={() => router.push({ pathname: '/(auth)/signup', params: { token: token ?? '' } })} fullWidth /> : null}
            {record.status === 'claimed' ? <Button title="Sign in" onPress={() => router.replace('/(auth)/login')} fullWidth /> : null}
            <Button title="Check a different token" variant="ghost" onPress={() => { reset(); setInput(''); }} fullWidth />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  tokenBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  token: { color: colors.ivory, fontSize: 15, fontFamily: 'Menlo', letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
