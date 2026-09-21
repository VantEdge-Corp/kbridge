import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError, BRAND, isSchemaOutOfDate } from '@peaches/core';
import { Button } from '@/components/Button';
import { Wordmark } from '@/components/Wordmark';
import { radius, spacing } from '@/constants/theme';
import { useStyles, useTheme, type Theme } from '@/lib/theme';
import { api } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <RootStack />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function Splash() {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  return (
    <View style={styles.splash}>
      <Wordmark size={24} />
      <Text style={[text.caption, { marginTop: 10 }]}>{BRAND.tagline}</Text>
    </View>
  );
}

/** Marks the member active on foreground (rate limited server-side). */
function useActivityPing(signedIn: boolean) {
  useEffect(() => {
    if (!signedIn) return;
    void api.discovery.touchActivity().catch(() => {});
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void api.discovery.touchActivity().catch(() => {});
    });
    return () => sub.remove();
  }, [signedIn]);
}

/**
 * The signed-in user has no loadable profile. Most often the Supabase project
 * this build points at is missing the latest migration; say so plainly.
 */
function ProfileProblem() {
  const styles = useStyles(makeStyles);
  const { text } = useTheme();
  const { profileError, refreshProfile, signOut } = useAuth();
  const [retrying, setRetrying] = React.useState(false);
  const schemaProblem = !!profileError && isSchemaOutOfDate(new ApiError(profileError, guessCode(profileError)));
  const retry = async () => {
    setRetrying(true);
    try {
      await refreshProfile();
    } finally {
      setRetrying(false);
    }
  };
  return (
    <View style={styles.problem}>
      <Wordmark size={22} />
      <Text style={[text.body, styles.problemText]}>
        {profileError
          ? schemaProblem
            ? 'This Supabase project is missing the latest migration, so Peaches cannot read member profiles yet.'
            : 'Peaches could not load your account.'
          : "Your account exists but your member profile isn't ready yet. If you just created it, give it a moment and try again."}
      </Text>
      {profileError ? (
        <View style={styles.problemDetail}>
          <Text style={text.bodySmall}>{profileError}</Text>
        </View>
      ) : null}
      {schemaProblem ? (
        <Text style={[text.caption, styles.problemText]}>Run supabase/migrations/013_peaches.sql on that project, then try again.</Text>
      ) : null}
      <View style={styles.problemActions}>
        <Button title={retrying ? 'Checking…' : 'Try again'} variant="secondary" onPress={() => void retry()} disabled={retrying} />
        <Button title="Sign out" variant="ghost" onPress={() => void signOut()} />
      </View>
    </View>
  );
}

function guessCode(message: string): string | null {
  if (/column .* does not exist/i.test(message)) return '42703';
  if (/relation .* does not exist|could not find the table/i.test(message)) return '42P01';
  if (/function .* does not exist|could not find the function/i.test(message)) return '42883';
  return null;
}

function RootStack() {
  const { colors } = useTheme();
  const { session, booting, profile, profileReady } = useAuth();
  const signedIn = !!session;
  useActivityPing(signedIn);
  if (booting) return <Splash />;
  if (signedIn && !profileReady) return <Splash />;
  if (signedIn && !profile) return <ProfileProblem />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/[id]" />
        <Stack.Screen name="chat/[matchId]" />
        <Stack.Screen name="post/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="me/edit" />
        <Stack.Screen name="me/preferences" />
        <Stack.Screen name="me/photos" />
        <Stack.Screen name="me/saved" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/[section]" />
      </Stack.Protected>
    </Stack>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  problem: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  problemText: { textAlign: 'center', color: colors.textSecondary, maxWidth: 360 },
  problemDetail: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: 360,
  },
  problemActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
