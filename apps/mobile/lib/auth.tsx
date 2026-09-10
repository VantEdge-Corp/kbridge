import type { Session } from '@supabase/supabase-js';
import type { OwnProfile } from '@peaches/core';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { supabase } from './supabase';

interface AuthValue {
  session: Session | null;
  userId: string | null;
  email: string;
  booting: boolean;
  profile: OwnProfile | null;
  refreshProfile: () => Promise<OwnProfile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Development convenience only: signs in with EXPO_PUBLIC_DEV_EMAIL /
 * EXPO_PUBLIC_DEV_PASSWORD when no session exists. Guarded by __DEV__, so the
 * code and the values are dropped from production bundles.
 */
async function devAutoSignIn(): Promise<void> {
  if (!__DEV__) return;
  const email = process.env.EXPO_PUBLIC_DEV_EMAIL;
  const password = process.env.EXPO_PUBLIC_DEV_PASSWORD;
  if (!email || !password) return;
  await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [profile, setProfile] = useState<OwnProfile | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        let session = data.session;
        if (!session) {
          await devAutoSignIn();
          session = (await supabase.auth.getSession()).data.session;
        }
        if (!mounted) return;
        setSession(session);
        setBooting(false);
      })
      .catch(() => {
        if (mounted) setBooting(false);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    const next = await api.profiles.getOwn(userId);
    setProfile(next);
    return next;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setProfile(null);
      return;
    }
    api.profiles
      .getOwn(userId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      userId,
      email: session?.user.email ?? '',
      booting,
      profile,
      refreshProfile,
      signOut,
    }),
    [session, userId, booting, profile, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

/** The signed-in member. Only render inside the protected group. */
export function useMember(): AuthValue & { userId: string } {
  const value = useAuth();
  if (!value.userId) throw new Error('No signed-in member');
  return value as AuthValue & { userId: string };
}
