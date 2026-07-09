import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Screen, Field, Button, ErrorText, Label, Rule } from '../components/ui.js';
import { useAuth } from '../auth/AuthContext.js';
import { colors, fonts, spacing } from '../theme.js';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Email and password, please.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e.message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ alignItems: 'center', marginBottom: spacing(5) }}>
          <Text style={styles.wordmark}>
            kbridge<Text style={styles.wordmarkDot}>.</Text>
          </Text>
          <Label style={{ marginTop: spacing(1) }}>Members' entrance</Label>
        </View>

        <Rule style={{ marginBottom: spacing(4) }} />

        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

        <ErrorText>{error}</ErrorText>
        <Button title={busy ? 'One moment…' : 'Enter'} onPress={submit} disabled={busy} />

        <Text style={styles.footnote}>
          Admission is by application. Apply — and set your password — on the web.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.text,
  },
  wordmarkDot: {
    fontStyle: 'italic',
    color: colors.accent,
  },
  footnote: {
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 17,
    letterSpacing: 0.5,
    color: colors.faint,
    textAlign: 'center',
    marginTop: spacing(4),
  },
});
