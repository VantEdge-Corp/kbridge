import { useState } from 'react';
import { longDate, type AdminApplicationStatus, type ApplicationRow } from '@peaches/core';
import { api, errorMessage } from '../../lib/api';
import { useMember } from '../../auth/AuthProvider';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Notice, TextArea, inputClass } from '../../components/Field';
import { Icon } from '../../components/icons';
import { LoadingBlock } from '../../components/Loading';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';

const TABS: ReadonlyArray<{ key: AdminApplicationStatus; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'waitlisted', label: 'Deferred' },
  { key: 'approved', label: 'Admitted' },
  { key: 'claimed', label: 'Active' },
  { key: 'rejected', label: 'Declined' },
];

function Dossier({ app, onChanged }: { app: ApplicationRow; onChanged: () => void }) {
  const { user } = useMember();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(app.internalNote ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noteDirty = note !== (app.internalNote ?? '');

  const decide = async (status: AdminApplicationStatus) => {
    setBusy(true);
    setError(null);
    try {
      if (noteDirty) await api.applications.admin.saveNote(app.id, note);
      await api.applications.admin.decide(app.id, status, user.id);
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.applications.admin.saveNote(app.id, note);
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const rows: Array<[string, string | null | undefined]> = [
    ['Email', app.email],
    ['Age', app.age != null ? String(app.age) : null],
    ['Area', app.city],
    ['Occupation', app.occupation],
    ['Employer', app.company],
    ['Experience', app.yearsExperience != null ? `${app.yearsExperience} years` : null],
    ['LinkedIn', app.linkedinUrl],
    ['School', app.school],
    ['Degree', app.degree],
    ['Applied', longDate(app.createdAt)],
    ['Decided', app.decidedAt ? longDate(app.decidedAt) : null],
    ['Consent', app.consentedAt ? `${longDate(app.consentedAt)} · Terms ${app.termsVersion ?? '?'} · Privacy ${app.privacyVersion ?? '?'} · 18+ ${app.ageConfirmed ? 'confirmed' : 'not confirmed'}` : 'Not recorded'],
  ];

  return (
    <article className="border border-border rounded-lg bg-surface" data-testid="dossier">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center gap-3 px-4 min-h-14 text-left">
        <span className="font-display text-name text-text">{app.firstName}</span>
        <span className="text-body-sm text-text-muted truncate">
          {[app.occupation, app.company, app.city].filter(Boolean).join(' · ')}
        </span>
        <span className="ml-auto text-caption text-text-muted shrink-0">{longDate(app.createdAt)}</span>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={18} className="text-text-faint shrink-0" />
      </button>
      {open ? (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-5">
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-body-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
                <dt className="text-text-muted">{k}</dt>
                <dd className="text-text break-words">{v || <span className="text-text-faint">—</span>}</dd>
              </div>
            ))}
          </dl>
          {app.bio ? (
            <div>
              <p className="text-micro uppercase tracking-[1.2px] text-text-muted mb-1">Bio</p>
              <p className="text-body-sm text-text whitespace-pre-wrap">{app.bio}</p>
            </div>
          ) : null}
          {app.why ? (
            <div>
              <p className="text-micro uppercase tracking-[1.2px] text-text-muted mb-1">Why Peaches</p>
              <p className="text-body-sm text-text whitespace-pre-wrap">{app.why}</p>
            </div>
          ) : null}
          <div>
            <TextArea label="Internal note" hint="Never shown to the applicant" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            {noteDirty ? (
              <div className="mt-2">
                <Button size="sm" variant="secondary" onClick={() => void saveNote()} disabled={busy}>
                  Save note
                </Button>
              </div>
            ) : null}
          </div>
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <div className="flex flex-wrap gap-2">
            {app.status !== 'claimed' && app.status !== 'approved' ? (
              <Button size="sm" onClick={() => void decide('approved')} disabled={busy}>
                Admit
              </Button>
            ) : null}
            {app.status === 'pending' || app.status === 'rejected' ? (
              <Button size="sm" variant="secondary" onClick={() => void decide('waitlisted')} disabled={busy}>
                Defer
              </Button>
            ) : null}
            {app.status !== 'rejected' && app.status !== 'claimed' ? (
              <Button size="sm" variant="danger" onClick={() => void decide('rejected')} disabled={busy} title="The applicant is not notified">
                Decline (silent)
              </Button>
            ) : null}
            {app.status === 'approved' || app.status === 'rejected' || app.status === 'waitlisted' ? (
              <Button size="sm" variant="ghost" onClick={() => void decide('pending')} disabled={busy}>
                Reopen
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function AdminApplications() {
  usePageTitle('Applications');
  const [status, setStatus] = useState<AdminApplicationStatus>('pending');
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useAsync(() => api.applications.admin.list({ status, search }), [status, search]);
  return (
    <div data-testid="admin-applications">
      <h1 className="font-display text-title text-text mb-4">Applications</h1>
      <SegmentedTabs segments={TABS} value={status} onChange={setStatus} className="mb-4" />
      <div className="relative mb-4 max-w-sm">
        <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, area, occupation" aria-label="Search applications" className={`${inputClass} h-11 pl-10`} />
      </div>
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice tone="danger">{error}</Notice>
      ) : !data || data.length === 0 ? (
        <EmptyState title="Nothing here." body="No applications with this status." />
      ) : (
        <div className="space-y-2">
          {data.map((app) => (
            <Dossier key={app.id} app={app} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
