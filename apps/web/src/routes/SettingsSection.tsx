import { useEffect, useState, type FormEvent } from 'react';
import { LuMonitor, LuMoon, LuSun, LuUserX } from 'react-icons/lu';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BRAND, longDate, type Education, type Employment, type PublicProfile } from '@peaches/core';
import { useAuth, useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { useConfirm } from '@/components/ConfirmProvider';
import { EmptyState } from '@/components/EmptyState';
import { SwitchField, TextField } from '@/components/form';
import { LoadingBlock } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { PersonAvatar } from '@/components/PersonAvatar';
import { RowGroup } from '@/components/SettingsRow';
import { VerificationStatusList } from '@/components/VerificationStatusList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { THEME_PREFERENCES, useTheme, type ThemePreference } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { SETTINGS_SECTIONS } from '@/routes/Settings';

const LINK = 'font-medium text-foreground underline underline-offset-4';

function Account() {
  const { user, profile, email } = useMember();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const change = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6 || password !== confirm) {
      setError('Passwords must match and be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      setConfirm('');
      toast.add({ title: 'Password updated', type: 'success' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="break-all">{email}</dd>
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{longDate(profile.createdAt)}</dd>
            <dt className="text-muted-foreground">Member id</dt>
            <dd className="font-mono text-xs break-all text-muted-foreground">{user.id}</dd>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>At least 6 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="change-password" onSubmit={(e) => void change(e)} className="grid max-w-sm gap-5">
            <TextField label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <TextField label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {error ? <Notice tone="danger">{error}</Notice> : null}
          </form>
        </CardContent>
        <CardFooter className="border-t">
          <Button type="submit" form="change-password" variant="outline" disabled={busy || !password}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            Update password
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

const APPEARANCE_ICON: Record<ThemePreference, typeof LuSun> = { system: LuMonitor, light: LuSun, dark: LuMoon };

/** System, Light, or Dark, stored in this browser. */
function Appearance() {
  const { preference, setPreference } = useTheme();
  return (
    <div role="radiogroup" aria-label="Appearance" className="grid gap-3 sm:grid-cols-3">
      {THEME_PREFERENCES.map((option) => {
        const Icon = APPEARANCE_ICON[option.value];
        const checked = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setPreference(option.value)}
            className={cn(
              'grid gap-3 rounded-xl border bg-card p-4 text-left shadow-xs outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50',
              checked && 'border-primary ring-1 ring-primary',
            )}
          >
            <span className={cn('flex size-9 items-center justify-center rounded-md', checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
              <Icon className="size-4" />
            </span>
            <span className="grid gap-0.5">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-sm text-muted-foreground">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Privacy() {
  const { user, email, profile } = useMember();
  const { refreshProfile } = useAuth();
  const { data: priv, loading, error, reload } = useAsync(() => api.profiles.getPrivate(user.id, email), [user.id]);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await refreshProfile();
      reload();
    } catch (e) {
      toast.add({ title: 'Could not save', description: errorMessage(e), type: 'error' });
    } finally {
      setBusy(false);
    }
  };
  if (loading || (!priv && !error)) return <LoadingBlock />;
  if (error || !priv) return <LoadError message={error ?? 'Could not load your settings.'} onRetry={reload} />;
  const education: Education = priv.education ?? { school: '', degreeLevel: 'other', fieldOfStudy: '', graduationYear: null, currentlyEnrolled: false, publicDisplayEnabled: true };
  const employment: Employment = priv.employment ?? { occupation: profile.occupation, employer: '', employmentStatus: 'other', publicEmployerDisplayEnabled: true };
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>What others see</CardTitle>
          <CardDescription>Changes apply to your profile right away.</CardDescription>
        </CardHeader>
        <CardContent className={cn('gap-5', busy && 'pointer-events-none opacity-60')}>
          <SwitchField
            label="Show education on my profile"
            description="School, degree, and field of study"
            checked={education.publicDisplayEnabled}
            onCheckedChange={(v) => void run(() => api.profiles.updatePrivate(user.id, { education: { ...education, publicDisplayEnabled: v } }))}
          />
          <Separator />
          <SwitchField
            label="Show employer on my profile"
            description="Your occupation is always shown"
            checked={employment.publicEmployerDisplayEnabled}
            onCheckedChange={(v) => void run(() => api.profiles.updatePrivate(user.id, { employment: { ...employment, publicEmployerDisplayEnabled: v } }))}
          />
          <Separator />
          <SwitchField
            label="Keep race / ethnicity private"
            description="Prefer not to say: hidden and never used in matching"
            checked={profile.raceEthnicityDisclosure === 'prefer_not_to_say'}
            onCheckedChange={(v) => void run(() => api.profiles.updatePublic(user.id, { raceEthnicityDisclosure: v ? 'prefer_not_to_say' : profile.raceEthnicities.length ? 'disclosed' : 'not_provided' }))}
          />
        </CardContent>
      </Card>
      <div className="grid gap-2 text-sm text-muted-foreground">
        <p>Your exact area is private. Other members see only a coarse label such as &ldquo;{profile.displayArea}.&rdquo;</p>
        <p>
          Read the{' '}
          <Link to="/privacy" className={LINK}>
            Privacy Policy
          </Link>
          ,{' '}
          <Link to="/terms" className={LINK}>
            Terms of Service
          </Link>
          , and{' '}
          <Link to="/child-safety" className={LINK}>
            Child Safety Standards
          </Link>
          . Questions go to{' '}
          <a href={`mailto:${BRAND.supportEmail}`} className={LINK}>
            {BRAND.supportEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function Notifications() {
  return (
    <Card>
      <CardContent className="gap-3 text-sm">
        <p>Push and email notifications aren&apos;t enabled yet. New introduction requests and messages appear in your Inbox, which updates live while the app is open.</p>
        <p className="text-muted-foreground">When notifications arrive, you will choose here which ones you want.</p>
      </CardContent>
    </Card>
  );
}

function Verification() {
  const { profile } = useMember();
  const { refreshProfile } = useAuth();
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Each dimension is reviewed on its own by the committee. Only confirmed dimensions are shown to other members; pending and declined states stay private to you.</p>
      <VerificationStatusList verification={profile.verification} onChanged={() => void refreshProfile()} />
    </div>
  );
}

function BlockedUsers() {
  const { user } = useMember();
  const { data, loading, error, reload } = useAsync(() => api.safety.listBlocked(user.id), [user.id]);
  const unblock = async (p: PublicProfile) => {
    try {
      await api.safety.unblock(user.id, p.id);
      toast.add({ title: `${p.firstName} is unblocked`, type: 'success' });
      reload();
    } catch (e) {
      toast.add({ title: 'Could not unblock', description: errorMessage(e), type: 'error' });
    }
  };
  if (loading) return <LoadingBlock />;
  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!data || data.length === 0) return <EmptyState icon={LuUserX} title="You haven't blocked anyone." body="Blocked members can't see you or contact you, and you won't see them." />;
  return (
    <RowGroup>
      {data.map((p) => (
        <Item key={p.id} className="rounded-none px-4 py-3">
          <ItemMedia>
            <PersonAvatar name={p.firstName} src={p.photos[0] ?? null} className="size-9" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{p.firstName}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Button size="sm" variant="outline" onClick={() => void unblock(p)}>
              Unblock
            </Button>
          </ItemActions>
        </Item>
      ))}
    </RowGroup>
  );
}

function Safety() {
  return (
    <Card>
      <CardContent className="gap-4 text-sm">
        <ul className="ml-5 grid list-disc gap-2 marker:text-muted-foreground">
          <li>Meet in public for the first few times, and tell someone your plans.</li>
          <li>Keep conversations in the app until you are comfortable.</li>
          <li>Never send money or financial details to someone you have not met.</li>
          <li>Trust your read on a person. You can end any conversation by blocking.</li>
        </ul>
        <Separator />
        <p className="text-muted-foreground">
          To report someone, open their profile or the conversation and choose <span className="font-medium text-foreground">Report</span> from the menu. Posts can be reported from the feed. Every report is reviewed by a person, and reporting is never visible to the other member.
        </p>
        <p className="text-muted-foreground">If you feel unsafe, contact local authorities first.</p>
      </CardContent>
    </Card>
  );
}

function DataAccount() {
  const { profile } = useMember();
  const { signOut } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = async () => {
    const ok = await confirm({
      title: 'Delete your account permanently?',
      description: 'Your application, profile, photos, posts, requests, and messages are deleted with it. This cannot be undone.',
      confirmLabel: 'Yes, delete everything',
      cancelLabel: 'Keep my account',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await api.safety.deleteMyAccount(profile.photoPaths);
      await signOut();
      navigate('/', { replace: true });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };
  return (
    <Card className="ring-destructive/30">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>Your application, profile, photos, posts, requests, and messages are deleted with your account. This cannot be undone.</CardDescription>
      </CardHeader>
      {error ? (
        <CardContent>
          <Notice tone="danger">{error}</Notice>
        </CardContent>
      ) : null}
      <CardFooter className="border-t">
        <Button variant="destructive" onClick={() => void remove()} disabled={busy}>
          {busy ? <Spinner data-icon="inline-start" /> : null}
          Delete my account
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SettingsSection() {
  const { section = '' } = useParams();
  const entry = SETTINGS_SECTIONS.find((s) => s.slug === section);
  usePageTitle(entry?.label ?? 'Settings');
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);
  if (!entry) return <Navigate to="/settings" replace />;
  if (entry.slug === 'discovery-preferences') return <Navigate to="/me/preferences" replace />;
  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader title={entry.label} back="/settings" />
      {entry.slug === 'account' ? <Account /> : null}
      {entry.slug === 'appearance' ? <Appearance /> : null}
      {entry.slug === 'privacy' ? <Privacy /> : null}
      {entry.slug === 'notifications' ? <Notifications /> : null}
      {entry.slug === 'verification' ? <Verification /> : null}
      {entry.slug === 'blocked-users' ? <BlockedUsers /> : null}
      {entry.slug === 'safety' ? <Safety /> : null}
      {entry.slug === 'data-account' ? <DataAccount /> : null}
    </div>
  );
}
