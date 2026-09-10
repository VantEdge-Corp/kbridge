import type { Session } from '@supabase/supabase-js';
import { errorMessage, type OwnProfile } from '@peaches/core';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { supabase } from './supabase';

interface AuthValue {
  session: Session | null;
  userId: string | null;
  email: string;
  booting: boolean;
  profile: OwnProfile | null;
  /** True once the profile fetch for the current session has settled. */
  profileReady: boolean;
  /** Why the profile could not be loaded, when the query itself failed. */
  profileError: string | null;
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
  const [profileFor, setProfileFor] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

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
      setProfileFor(null);
      setProfileError(null);
      return null;
    }
    try {
      const next = await api.profiles.getOwn(userId);
      setProfile(next);
      setProfileError(null);
      return next;
    } catch (error) {
      setProfile(null);
      setProfileError(errorMessage(error));
      return null;
    } finally {
      setProfileFor(userId);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setProfile(null);
      setProfileFor(null);
      setProfileError(null);
      return;
    }
    api.profiles
      .getOwn(userId)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setProfileError(null);
        setProfileFor(userId);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setProfile(null);
        setProfileError(errorMessage(error));
        setProfileFor(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileFor(null);
    setProfileError(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      userId,
      email: session?.user.email ?? '',
      booting,
      profile,
      profileReady: !!userId && profileFor === userId,
      profileError,
      refreshProfile,
      signOut,
    }),
    [session, userId, booting, profile, profileFor, profileError, refreshProfile, signOut],
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
