import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isValidEmail } from '@peaches/core';
import { Button } from '@/components/Button';
import { ErrorText } from '@/components/ErrorText';
import { Field } from '@/components/Field';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing, text } from '@/constants/theme';
import { errorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const { confirm, email: emailParam } = useLocalSearchParams<{ confirm?: string; email?: string }>();
  const [email, setEmail] = useState(emailParam ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      // The protected route group switches automatically once the session exists.
    } catch (e) {
      setError(errorMessage(e, 'Sign in failed.'));
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Header back />
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={text.title}>Sign in</Text>
          {confirm ? (
            <View style={styles.banner}>
              <Text style={text.bodySmall}>Account created. Confirm your email from the message we sent, then sign in.</Text>
            </View>
          ) : null}
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" onSubmitEditing={submit} returnKeyType="go" />
          <ErrorText message={error} />
          <Button title="Sign in" onPress={submit} loading={busy} fullWidth />
          <View style={styles.links}>
            <Button title="Apply for membership" variant="ghost" size="small" onPress={() => router.push('/(auth)/apply')} />
            <Button title="Check application status" variant="ghost" size="small" onPress={() => router.push('/(auth)/status')} />
          </View>
          <Text style={[text.micro, { textAlign: 'center' }]}>Admission is by application. No account exists until you are approved.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.lg },
  banner: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  links: { alignItems: 'center', gap: 2 },
});
