import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen, Field, Button, ErrorText, Label, Rule } from '../components/ui.js';
import { useAuth } from '../auth/AuthContext.js';
import { colors, fonts, spacing } from '../theme.js';

export default function LoginScreen({ route, navigation }) {
  const { signIn } = useAuth();
  const confirmBanner = !!route.params?.confirm;
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

        {confirmBanner && (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>
              Account created. Confirm via the email we sent you, then sign in.
            </Text>
          </View>
        )}

        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

        <ErrorText>{error}</ErrorText>
        <Button title={busy ? 'One moment…' : 'Enter'} onPress={submit} disabled={busy} />

        <Rule style={{ marginVertical: spacing(4) }} />

        <Pressable onPress={() => navigation.navigate('Apply')} style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}>
          <Text style={styles.linkText}>Not a member? Apply for membership</Text>
          <Feather name="arrow-right" size={13} color={colors.accent} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Status')} style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}>
          <Text style={styles.linkText}>Already applied? Check your status</Text>
          <Feather name="arrow-right" size={13} color={colors.accent} />
        </Pressable>

        <Text style={styles.footnote}>
          Admission is by application, read by hand. No account until approved.
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
  confirmBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
    padding: spacing(2),
    marginBottom: spacing(3),
  },
  confirmText: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(1.5),
  },
  linkText: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.text,
  },
});
