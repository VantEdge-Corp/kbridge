import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ApiError, isSchemaOutOfDate } from '@peaches/core';
import { useAuth } from '@/auth/AuthProvider';
import { FullScreenLoading } from '@/components/Loading';
import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

/**
 * Shown when the signed-in user has no loadable profile. Distinguishes a query
 * that failed (most often a Supabase project missing the latest migration)
 * from a genuinely missing profile row.
 */
function AccountNotReady() {
  const { signOut, refreshProfile, profileError } = useAuth();
  const [retrying, setRetrying] = useState(false);
  const schemaProblem = profileError ? isSchemaOutOfDate(new ApiError(profileError, guessCode(profileError))) : false;

  const retry = async () => {
    setRetrying(true);
    try {
      await refreshProfile();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Wordmark />
      {profileError ? (
        <>
          <p className="max-w-md text-muted-foreground">
            {schemaProblem
              ? 'This Supabase project is missing the latest migration, so Peaches cannot read member profiles yet.'
              : 'Peaches could not load your account.'}
          </p>
          <pre className="max-w-md rounded-lg border bg-muted/50 px-4 py-3 text-left font-mono text-xs whitespace-pre-wrap text-muted-foreground">
            {profileError}
          </pre>
          {schemaProblem ? (
            <p className="max-w-md text-sm text-muted-foreground">
              Run <code>supabase/migrations/013_peaches.sql</code> in the SQL editor of the project this app points at, then try again.
            </p>
          ) : null}
        </>
      ) : (
        <p className="max-w-sm text-muted-foreground">
          Your account exists but your member profile isn&apos;t ready yet. If you just created your account, give it a
          moment and try again. Otherwise contact us and we&apos;ll sort it out.
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => void retry()} disabled={retrying}>
          {retrying ? <Spinner data-icon="inline-start" /> : null}
          Try again
        </Button>
        <Button variant="ghost" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </main>
  );
}

/** The provider keeps only the message; recover the likely SQLSTATE so the schema check can use it. */
function guessCode(message: string): string | null {
  if (/column .* does not exist/i.test(message)) return '42703';
  if (/relation .* does not exist|could not find the table/i.test(message)) return '42P01';
  if (/function .* does not exist|could not find the function/i.test(message)) return '42883';
  return null;
}

/** Member sections. Admins are sent to the panel unless they chose to browse as a member. */
export function RequireMember({ children, allowAdmin = false }: { children: ReactNode; allowAdmin?: boolean }) {
  const { loading, user, profile, adminAsMember } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) return <AccountNotReady />;
  if (profile.isAdmin && !adminAsMember && !allowAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { loading, user, profile } = useAuth();
  if (loading) return <FullScreenLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <AccountNotReady />;
  if (!profile.isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

/** Sign-in and sign-up pages: a signed-in member lands in the app instead. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { loading, user, profile, adminAsMember } = useAuth();
  if (loading) return <FullScreenLoading />;
  if (user && profile) return <Navigate to={profile.isAdmin && !adminAsMember ? '/admin' : '/home'} replace />;
  return <>{children}</>;
}

export function homeFor(profile: { isAdmin: boolean } | null, adminAsMember: boolean): string {
  return profile?.isAdmin && !adminAsMember ? '/admin' : '/home';
}
