import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BRAND, longDate, type Education, type Employment, type PublicProfile } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth, useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button } from '../components/Button';
import { Input, Notice, Toggle } from '../components/Field';
import { Group, GroupSection, ROW_HAIRLINE, rowInset } from '../components/Group';
import { LoadingBlock } from '../components/Loading';
import { Avatar } from '../components/MonogramPortrait';
import { VerificationStatusList } from '../components/VerificationStatusList';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';
import { SETTINGS_SECTIONS, type SettingsSlug } from './Settings';

function Account() {
  const { user, profile, email } = useMember();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'neutral' | 'danger'; text: string } | null>(null);
  const change = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6 || password !== confirm) {
      setMessage({ tone: 'danger', text: 'Passwords must match and be at least 6 characters.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirm('');
      setMessage({ tone: 'neutral', text: 'Password updated.' });
    } catch (err) {
      setMessage({ tone: 'danger', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Group>
      <GroupSection eyebrow="Account">
        <dl className="grid grid-cols-[140px_1fr] gap-y-2.5 text-body-sm">
          <dt className="text-text-muted">Email</dt>
          <dd className="text-text">{email}</dd>
          <dt className="text-text-muted">Member since</dt>
          <dd className="text-text">{longDate(profile.createdAt)}</dd>
          <dt className="text-text-muted">Member id</dt>
          <dd className="text-text-secondary text-caption break-all">{user.id}</dd>
        </dl>
      </GroupSection>
      <GroupSection eyebrow="Change password">
        <form onSubmit={(e) => void change(e)} className="space-y-4 max-w-sm">
          <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
          <Button type="submit" variant="secondary" disabled={busy || !password}>
            {busy ? 'Updating' : 'Update password'}
          </Button>
        </form>
      </GroupSection>
    </Group>
  );
}

function Privacy() {
  const { user, email, profile } = useMember();
  const { refreshProfile } = useAuth();
  const { data: priv, loading, error, reload } = useAsync(() => api.profiles.getPrivate(user.id, email), [user.id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      await refreshProfile();
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (loading || !priv) return <LoadingBlock />;
  if (error) return <Notice tone="danger">{error}</Notice>;
  const education: Education = priv.education ?? { school: '', degreeLevel: 'other', fieldOfStudy: '', graduationYear: null, currentlyEnrolled: false, publicDisplayEnabled: true };
  const employment: Employment = priv.employment ?? { occupation: profile.occupation, employer: '', employmentStatus: 'other', publicEmployerDisplayEnabled: true };
  const toggleRow = (node: ReactNode) => (
    <div className={`${ROW_HAIRLINE} px-4`} style={rowInset(16)}>
      {node}
    </div>
  );
  return (
    <div className="space-y-4">
      <Group>
        <div className={busy ? 'opacity-60 pointer-events-none' : ''}>
          {toggleRow(<Toggle label="Show education on my profile" description="School, degree, and field of study" checked={education.publicDisplayEnabled} onChange={(v) => void run(() => api.profiles.updatePrivate(user.id, { education: { ...education, publicDisplayEnabled: v } }))} />)}
          {toggleRow(<Toggle label="Show employer on my profile" description="Your occupation is always shown" checked={employment.publicEmployerDisplayEnabled} onChange={(v) => void run(() => api.profiles.updatePrivate(user.id, { employment: { ...employment, publicEmployerDisplayEnabled: v } }))} />)}
          {toggleRow(
            <Toggle
              label="Keep race / ethnicity private"
              description="Prefer not to say: hidden and never used in matching"
              checked={profile.raceEthnicityDisclosure === 'prefer_not_to_say'}
              onChange={(v) => void run(() => api.profiles.updatePublic(user.id, { raceEthnicityDisclosure: v ? 'prefer_not_to_say' : profile.raceEthnicities.length ? 'disclosed' : 'not_provided' }))}
            />,
          )}
        </div>
      </Group>
      {actionError ? <Notice tone="danger">{actionError}</Notice> : null}
      <Group>
        <GroupSection>
          <div className="text-body-sm text-text-muted space-y-2">
            <p>Your exact area is private. Other members see only a coarse label such as &ldquo;{profile.displayArea}.&rdquo;</p>
            <p>
              Read the{' '}
              <Link to="/privacy" className="text-text underline underline-offset-4 decoration-1">
                Privacy Policy
              </Link>
              ,{' '}
              <Link to="/terms" className="text-text underline underline-offset-4 decoration-1">
                Terms of Service
              </Link>
              , and{' '}
              <Link to="/child-safety" className="text-text underline underline-offset-4 decoration-1">
                Child Safety Standards
              </Link>
              . Questions go to{' '}
              <a href={`mailto:${BRAND.supportEmail}`} className="text-text underline underline-offset-4 decoration-1">
                {BRAND.supportEmail}
              </a>
              .
            </p>
          </div>
        </GroupSection>
      </Group>
    </div>
  );
}

function Notifications() {
  return (
    <Group>
      <GroupSection>
        <div className="text-body-sm text-text-secondary space-y-3 max-w-prose">
          <p>Push and email notifications aren&apos;t enabled yet. New introduction requests and messages appear in your Inbox, which updates live while the app is open.</p>
          <p className="text-text-muted">When notifications arrive, you will choose here which ones you want.</p>
        </div>
      </GroupSection>
    </Group>
  );
}

function Verification() {
  const { profile } = useMember();
  const { refreshProfile } = useAuth();
  return (
    <div className="space-y-4">
      <p className="text-body-sm text-text-muted max-w-prose">Each dimension is reviewed on its own by the committee. Only confirmed dimensions are shown to other members; pending and declined states stay private to you.</p>
      <VerificationStatusList verification={profile.verification} onChanged={() => void refreshProfile()} />
    </div>
  );
}

function BlockedUsers() {
  const { user } = useMember();
  const { data, loading, error, reload } = useAsync(() => api.safety.listBlocked(user.id), [user.id]);
  const [actionError, setActionError] = useState<string | null>(null);
  const unblock = async (p: PublicProfile) => {
    try {
      await api.safety.unblock(user.id, p.id);
      reload();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };
  if (loading) return <LoadingBlock />;
  if (error) return <Notice tone="danger">{error}</Notice>;
  return (
    <div className="space-y-4">
      {actionError ? <Notice tone="danger">{actionError}</Notice> : null}
      {!data || data.length === 0 ? (
        <Group>
          <GroupSection>
            <p className="text-body-sm text-text-muted">You haven&apos;t blocked anyone.</p>
          </GroupSection>
        </Group>
      ) : (
        <Group>
          <ul>
            {data.map((p) => (
              <li key={p.id} className={`${ROW_HAIRLINE} flex items-center gap-3 px-4 py-3`} style={rowInset(64)}>
                <Avatar name={p.firstName} src={p.photos[0] ?? null} size={36} />
                <span className="flex-1 text-body text-text">{p.firstName}</span>
                <Button size="sm" variant="secondary" onClick={() => void unblock(p)}>
                  Unblock
                </Button>
              </li>
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
}

function Safety() {
  return (
    <Group>
      <GroupSection>
    <div className="text-body-sm text-text-secondary space-y-4 max-w-prose">
      <ul className="list-disc pl-5 space-y-2">
        <li>Meet in public for the first few times, and tell someone your plans.</li>
        <li>Keep conversations in the app until you are comfortable.</li>
        <li>Never send money or financial details to someone you have not met.</li>
        <li>Trust your read on a person. You can end any conversation by blocking.</li>
      </ul>
      <p>
        To report someone, open their profile or the conversation and choose <span className="text-text">Report</span> from the menu. Posts can be reported from the feed. Every report is reviewed by a person, and reporting is never visible to the other member.
      </p>
      <p className="text-text-muted">If you feel unsafe, contact local authorities first.</p>
    </div>
      </GroupSection>
    </Group>
  );
}

function DataAccount() {
  const { profile } = useMember();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = async () => {
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
    <Group>
      <GroupSection eyebrow="Delete account">
        <div className="space-y-5 max-w-prose">
          <p className="text-body-sm text-text-secondary">Your application, profile, photos, posts, requests, and messages are deleted with your account. This cannot be undone.</p>
          {step === 0 ? (
            <Button variant="danger" onClick={() => setStep(1)}>
              Delete my account
            </Button>
          ) : (
            <div className="border border-border rounded-md p-4 space-y-4 bg-canvas">
              <p className="text-body text-text">Delete your account permanently?</p>
              {error ? <Notice tone="danger">{error}</Notice> : null}
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(0)} disabled={busy}>
                  Keep my account
                </Button>
                <Button variant="danger" onClick={() => void remove()} disabled={busy}>
                  {busy ? 'Deleting' : 'Yes, delete everything'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </GroupSection>
    </Group>
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
  const slug = entry.slug as SettingsSlug;
  return (
    <div className="max-w-[720px]">
      <PageHeader title={entry.label} back="/settings" />
      {slug === 'account' ? <Account /> : null}
      {slug === 'privacy' ? <Privacy /> : null}
      {slug === 'discovery-preferences' ? <Navigate to="/me/preferences" replace /> : null}
      {slug === 'notifications' ? <Notifications /> : null}
      {slug === 'verification' ? <Verification /> : null}
      {slug === 'blocked-users' ? <BlockedUsers /> : null}
      {slug === 'safety' ? <Safety /> : null}
      {slug === 'data-account' ? <DataAccount /> : null}
    </div>
  );
}
