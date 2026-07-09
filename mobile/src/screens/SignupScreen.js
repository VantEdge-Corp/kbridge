// ─────────────────────────────────────────────────────────────────────────────
// SignupScreen.js — post-approval account creation, same contract as the
// web /signup/:token: fetch the approved application via RPC, choose a
// password, supabase.auth.signUp. The handle_new_user trigger enforces the
// approval gate server-side. On success with a session, the auth listener
// flips the navigator into the member tabs by itself.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { Text, Linking, StyleSheet } from 'react-native';
import { Screen, Label, Rule, Field, Button, Checkbox, ErrorText, Loading, BackBar } from '../components/ui.js';
import { supabase } from '../lib/supabase.js';
import { getApplicationForSignup, recordProfileConsent } from '../lib/applications.js';
import { LEGAL_VERSIONS, LEGAL_URLS } from '../legal.js';
import { colors, fonts, spacing } from '../theme.js';

const MIN_PASSWORD = 6;

export default function SignupScreen({ route, navigation }) {
  const { token } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [app, setApp] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const record = await getApplicationForSignup(token);
        if (cancelled) return;
        if (!record) {
          setLoadError('This signup link is invalid or your application is not yet approved.');
        } else {
          setApp(record);
          setEmail(record.email);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Could not load application.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const passwordOk = password.length >= MIN_PASSWORD;
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = !busy && email && passwordOk && passwordsMatch && agree;

  const submit = async () => {
    setTouched(true);
    setError('');
    if (!canSubmit) return;

    setBusy(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (signUpError) throw signUpError;

      // Record account-holder consent on the new profile (needs the session
      // for RLS; the same acceptance is also on the approved application).
      if (data.session && data.user?.id) {
        await recordProfileConsent(data.user.id, LEGAL_VERSIONS);
      }

      // With email confirmation enabled, signUp returns a user but no
      // session — the auth listener won't fire, so route back to Login
      // with a banner. With it disabled, the session flips the root
      // navigator into the member tabs on its own.
      if (!data.session) {
        navigation.navigate('Login', { confirm: true });
      }
    } catch (err) {
      setError(err.message || 'Could not create your account.');
      setBusy(false);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <BackBar onBack={() => navigation.goBack()} right={<Label>Create your account</Label>} />
      <Rule style={{ marginBottom: spacing(3) }} />

      {loading ? (
        <Loading />
      ) : loadError ? (
        <>
          <ErrorText>{loadError}</ErrorText>
          <Button title="Submit a new application" variant="ghost" onPress={() => navigation.replace('Apply')} style={{ marginTop: spacing(2) }} />
          <Button title="Sign in" variant="outline" onPress={() => navigation.popToTop()} style={{ marginTop: spacing(1.5) }} />
        </>
      ) : (
        <>
          <Label style={{ color: colors.accent, marginBottom: spacing(1.5) }}>Admitted</Label>
          <Text style={styles.title}>
            {app?.first_name ? `${app.first_name}, ` : ''}
            <Text style={styles.titleAccent}>welcome to kbridge.</Text>
          </Text>
          <Text style={styles.lede}>
            Choose a password to create your account. You'll use this email and
            password to sign in.
          </Text>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            hint="Pre-filled from your application. Changing it will fail unless that email has also been approved."
            style={{ marginTop: spacing(4) }}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder={`At least ${MIN_PASSWORD} characters`}
            secureTextEntry
            error={touched && password && !passwordOk ? `Use at least ${MIN_PASSWORD} characters.` : undefined}
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter your password"
            secureTextEntry
            error={touched && confirm && !passwordsMatch ? "Passwords don't match." : undefined}
          />

          <Checkbox
            checked={agree}
            onChange={setAgree}
            error={touched && !agree ? 'Required.' : undefined}
          >
            I have read and agree to the{' '}
            <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.terms)}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>Privacy Policy</Text>.
          </Checkbox>

          <ErrorText>{error}</ErrorText>
          <Button
            title={busy ? 'Creating account…' : 'Create account'}
            onPress={submit}
            disabled={!canSubmit}
          />
          <Text style={styles.footnote}>Approved by the committee.</Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 37,
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
  link: {
    color: colors.accent,
    textDecorationLine: 'underline',
  },
  footnote: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.faint,
    marginTop: spacing(2),
  },
});
