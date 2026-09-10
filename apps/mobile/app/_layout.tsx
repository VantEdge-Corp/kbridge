import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BRAND } from '@peaches/core';
import { Wordmark } from '@/components/Wordmark';
import { colors, text } from '@/constants/theme';
import { api } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth';


export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootStack />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function Splash() {
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

function RootStack() {
  const { session, booting } = useAuth();
  const signedIn = !!session;
  useActivityPing(signedIn);
  if (booting) return <Splash />;
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

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
});
