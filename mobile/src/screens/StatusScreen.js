// ─────────────────────────────────────────────────────────────────────────────
// StatusScreen.js — application status by reference token. Mirrors the web
// /status/:token page, including the silent-decline collapse (the RPC never
// reveals a rejection). The web has the token in the URL; here it arrives
// via navigation params, the saved copy in AsyncStorage, or manual entry.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Screen, Label, Rule, Field, Button, ErrorText, Loading, BackBar } from '../components/ui.js';
import { getApplicationStatusByToken } from '../lib/applications.js';
import { STATUS_TOKEN_KEY } from './ApplyScreen.js';
import { colors, fonts, spacing } from '../theme.js';

const STATUS_VIEW = {
  pending: {
    icon: 'clock',
    eyebrow: 'Under review',
    title: 'Your application is with the committee.',
    body: "We read every application personally. You'll hear from us once a decision has been made — typically within a few days.",
    cta: null,
  },
  waitlisted: {
    icon: 'clock',
    eyebrow: 'Deferred',
    title: "We'd like a bit more time.",
    body: "The committee has placed your application on a brief hold. We'll be in touch.",
    cta: null,
  },
  approved: {
    icon: 'star',
    eyebrow: 'Admitted',
    title: 'Welcome.',
    body: "Your application has been accepted. Continue to set up your account — you'll choose a password and use it to sign in from now on.",
    cta: 'signup',
  },
  claimed: {
    icon: 'check',
    eyebrow: 'Active member',
    title: "You're a member.",
    body: 'Your credentials have already been claimed. Sign in to enter.',
    cta: 'login',
  },
};

function fmt(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function StatusScreen({ route, navigation }) {
  const paramToken = route.params?.token;
  const justSubmitted = !!route.params?.justSubmitted;

  const [token, setToken] = useState(paramToken || '');
  const [input, setInput] = useState('');
  const [state, setState] = useState({ loading: !!paramToken, record: null, error: '' });

  useEffect(() => {
    if (paramToken) return;
    AsyncStorage.getItem(STATUS_TOKEN_KEY)
      .then(saved => { if (saved) setInput(saved); })
      .catch(() => {});
  }, [paramToken]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setState({ loading: true, record: null, error: '' });
    (async () => {
      try {
        const record = await getApplicationStatusByToken(token);
        if (cancelled) return;
        if (!record) {
          setState({ loading: false, record: null, error: "We couldn't find that application." });
        } else {
          setState({ loading: false, record, error: '' });
          AsyncStorage.setItem(STATUS_TOKEN_KEY, token).catch(() => {});
        }
      } catch (err) {
        if (!cancelled) setState({ loading: false, record: null, error: err.message || 'Something went wrong.' });
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const lookup = () => {
    const t = input.trim();
    if (t) setToken(t);
  };

  const record = state.record;
  const view = record ? (STATUS_VIEW[record.status] ?? STATUS_VIEW.pending) : null;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <BackBar onBack={() => navigation.goBack()} right={<Label>Application status</Label>} />
      <Rule style={{ marginBottom: spacing(3) }} />

      {!token ? (
        <>
          <Text style={styles.title}>Check on your application.</Text>
          <Text style={styles.lede}>
            Enter the reference token you were given when you applied.
          </Text>
          <Field
            label="Reference token"
            value={input}
            onChangeText={setInput}
            placeholder="e.g. 3f9c…"
            style={{ marginTop: spacing(3) }}
          />
          <Button title="Check status" onPress={lookup} disabled={!input.trim()} />
        </>
      ) : state.loading ? (
        <View style={{ paddingVertical: spacing(8) }}><Loading /></View>
      ) : state.error ? (
        <>
          <ErrorText>{state.error}</ErrorText>
          <Button
            title="Try another token"
            variant="ghost"
            onPress={() => { setToken(''); setState({ loading: false, record: null, error: '' }); }}
            style={{ marginTop: spacing(2) }}
          />
          <Button
            title="Submit a new application"
            variant="outline"
            onPress={() => navigation.replace('Apply')}
            style={{ marginTop: spacing(1.5) }}
          />
        </>
      ) : (
        <>
          {justSubmitted && (
            <View style={styles.tokenBox}>
              <Label style={{ color: colors.accent, marginBottom: spacing(1) }}>
                Application received — keep this token
              </Label>
              <Text style={styles.token} selectable>{token}</Text>
              <Text style={styles.tokenNote}>
                It's saved on this phone, but write it down too — it's the only
                way to check your status or claim your account.
              </Text>
            </View>
          )}

          <View style={styles.eyebrowRow}>
            <Feather name={view.icon} size={14} color={colors.accent} />
            <Label style={{ color: colors.accent }}>{view.eyebrow}</Label>
          </View>
          <Text style={styles.title}>
            {record.first_name ? `${record.first_name}, ` : ''}
            <Text style={styles.titleAccent}>{view.title}</Text>
          </Text>
          <Text style={styles.lede}>{view.body}</Text>
          {record.created_at ? (
            <Text style={styles.submitted}>Submitted {fmt(record.created_at)}</Text>
          ) : null}

          {view.cta === 'signup' && (
            <Button
              title="Create your account"
              onPress={() => navigation.navigate('Signup', { token })}
              style={{ marginTop: spacing(4) }}
            />
          )}
          {view.cta === 'login' && (
            <Button
              title="Sign in"
              onPress={() => navigation.popToTop()}
              style={{ marginTop: spacing(4) }}
            />
          )}

          <Button
            title="Check a different token"
            variant="ghost"
            onPress={() => { setToken(''); setInput(''); setState({ loading: false, record: null, error: '' }); }}
            style={{ marginTop: spacing(1.5) }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 35,
    color: colors.text,
  },
  titleAccent: {
    fontStyle: 'italic',
    color: colors.accent,
  },
  lede: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: '#a89d87',
    marginTop: spacing(1.5),
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    marginBottom: spacing(1.5),
  },
  submitted: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.faint,
    marginTop: spacing(2),
  },
  tokenBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
    padding: spacing(2),
    marginBottom: spacing(3),
  },
  token: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.text,
    letterSpacing: 0.5,
  },
  tokenNote: {
    fontFamily: fonts.mono,
    fontSize: 9,
    lineHeight: 15,
    color: colors.muted,
    marginTop: spacing(1),
  },
});
