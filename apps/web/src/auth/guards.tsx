import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { FullScreenLoading } from '../components/Loading';
import { Button } from '../components/Button';
import { Wordmark } from '../components/Wordmark';

function AccountNotReady() {
  const { signOut } = useAuth();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <Wordmark />
      <p className="max-w-sm text-text-secondary">
        Your account exists but your member profile isn&apos;t ready yet. If you just created your account, give it a
        moment and refresh. Otherwise contact us and we&apos;ll sort it out.
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Refresh
        </Button>
        <Button variant="ghost" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </main>
  );
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
