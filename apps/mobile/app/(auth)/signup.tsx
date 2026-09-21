import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { ErrorText } from '@/components/ErrorText';
import { Field } from '@/components/Field';
import { Header } from '@/components/Header';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { LEGAL_URLS, supabase } from '@/lib/supabase';

const MIN_PASSWORD = 6;

export default function Signup() {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    api.applications
      .forSignup(token)
      .then((app) => {
        if (cancelled) return;
        if (!app) setInvalid(true);
        else {
          setEmail(app.email);
          setFirstName(app.firstName);
        }
      })
      .catch(() => {
        if (!cancelled) setInvalid(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const canSubmit = password.length >= MIN_PASSWORD && password === confirm && agree && !!email;

  const submit = async () => {
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setError('Passwords do not match.');
    if (!agree) return setError('Please accept the Terms and Privacy Policy.');
    setBusy(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
      if (err) throw err;
      if (data.user) await api.applications.recordProfileConsent(data.user.id);
      if (!data.session) router.replace({ pathname: '/(auth)/login', params: { confirm: '1', email: email.trim() } });
      // With a session, the protected route group switches to the member tabs.
    } catch (e) {
      setError(errorMessage(e, 'The account could not be created.'));
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Header back title="Create your account" />
        {loading ? (
          <Loading />
        ) : invalid ? (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={text.bodySecondary}>This signup link is invalid or your application is not yet approved.</Text>
            <Button title="Check application status" variant="secondary" onPress={() => router.replace('/(auth)/status')} fullWidth />
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={text.title}>Welcome, {firstName}.</Text>
            <Text style={text.bodySmall}>Choose a password for the email on your application.</Text>
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} helper="Changing it will fail unless that email has also been approved." />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" helper={`At least ${MIN_PASSWORD} characters.`} />
            <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry textContentType="newPassword" />
            <Checkbox checked={agree} onChange={setAgree} accessibilityLabel="I agree to the Terms of Service and Privacy Policy">
              <Text style={text.bodySmall}>
                I have read and agree to the{' '}
                <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
                  Privacy Policy
                </Text>
                .
              </Text>
            </Checkbox>
            <ErrorText message={error} />
            <Button title="Create account" onPress={submit} loading={busy} disabled={!canSubmit} fullWidth />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  link: { color: colors.ivory, textDecorationLine: 'underline' },
});
