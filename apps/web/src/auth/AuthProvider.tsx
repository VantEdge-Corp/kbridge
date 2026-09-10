import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { errorMessage, type OwnProfile } from '@peaches/core';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const ADMIN_AS_MEMBER_KEY = 'peaches:adminAsMember';

interface AuthValue {
  /** True until the session and the initial profile fetch have both settled. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: OwnProfile | null;
  /** Why the profile could not be loaded, when the query itself failed. */
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  /** An admin browsing the member sections instead of the admin panel. */
  adminAsMember: boolean;
  setAdminAsMember: (value: boolean) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function readAdminAsMember(): boolean {
  try {
    return localStorage.getItem(ADMIN_AS_MEMBER_KEY) === '1';
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [profileFor, setProfileFor] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [adminAsMember, setAdminAsMemberState] = useState(readAdminAsMember);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setSessionReady(true);
      })
      .catch(() => {
        if (active) setSessionReady(true);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setProfileFor(null);
      setProfileError(null);
      return;
    }
    try {
      const next = await api.profiles.getOwn(userId);
      setProfile(next);
      setProfileError(null);
    } catch (error) {
      setProfile(null);
      setProfileError(errorMessage(error));
    }
    setProfileFor(userId);
  }, [userId]);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setProfile(null);
      setProfileFor(null);
      setProfileError(null);
      return;
    }
    api.profiles
      .getOwn(userId)
      .then((next) => {
        if (!active) return;
        setProfile(next);
        setProfileError(null);
        setProfileFor(userId);
        if (next) void api.discovery.touchActivity();
      })
      .catch((error: unknown) => {
        if (!active) return;
        setProfile(null);
        setProfileError(errorMessage(error));
        setProfileFor(userId);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileFor(null);
    setProfileError(null);
  }, []);

  const setAdminAsMember = useCallback((value: boolean) => {
    setAdminAsMemberState(value);
    try {
      localStorage.setItem(ADMIN_AS_MEMBER_KEY, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const loading = !sessionReady || (userId !== null && profileFor !== userId);

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      refreshProfile,
      signOut,
      adminAsMember,
      setAdminAsMember,
    }),
    [loading, session, profile, profileError, refreshProfile, signOut, adminAsMember, setAdminAsMember],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** For member routes: the signed-in user with a loaded profile. */
export function useMember(): { user: User; profile: OwnProfile; email: string } {
  const { user, profile } = useAuth();
  if (!user || !profile) throw new Error('useMember requires a signed-in member');
  return { user, profile, email: user.email ?? '' };
}
