import { useState } from 'react';
import {
  DEGREE_LEVEL_OPTIONS,
  VERIFICATION_DIMENSIONS,
  VERIFICATION_LABEL,
  VERIFICATION_STATES,
  VERIFICATION_STATE_LABEL,
  labelFor,
  longDate,
  timeAgo,
  type AdminMember,
  type DegreeLevel,
  type VerificationDimension,
  type VerificationState,
} from '@peaches/core';
import { api, errorMessage } from '../../lib/api';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Checkbox, Notice, inputClass } from '../../components/Field';
import { Icon } from '../../components/icons';
import { LoadingBlock } from '../../components/Loading';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';

function MemberCard({ member, onChanged }: { member: AdminMember; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const pending = VERIFICATION_DIMENSIONS.filter((d) => member.verification[d] === 'pending');
  return (
    <article className={`border rounded-lg bg-surface p-5 ${member.suspended ? 'border-danger/60' : 'border-border'}`} data-testid="member-card">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-name text-text">{member.firstName}</span>
        <span className="text-caption text-text-muted">{member.memberNumber}</span>
        <span className="text-body-sm text-text-muted">{[member.occupation, member.employer, member.displayArea].filter(Boolean).join(' · ')}</span>
        {member.suspended ? <span className="text-caption text-danger">Suspended</span> : null}
        {pending.length > 0 ? <span className="text-caption text-verified">{pending.length} pending review</span> : null}
      </div>
      <dl className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-body-sm">
        <div className="flex gap-2">
          <dt className="text-text-muted w-24 shrink-0">Education</dt>
          <dd className="text-text">{[member.school, member.degreeLevel ? labelFor(DEGREE_LEVEL_OPTIONS, member.degreeLevel as DegreeLevel) : '', member.fieldOfStudy].filter(Boolean).join(' · ') || '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-text-muted w-24 shrink-0">Joined</dt>
          <dd className="text-text">
            {member.createdAt ? longDate(member.createdAt) : '—'} · active {member.lastActiveAt ? timeAgo(member.lastActiveAt) : '—'} · {member.photoCount} photos
          </dd>
        </div>
      </dl>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {VERIFICATION_DIMENSIONS.map((d: VerificationDimension) => (
          <label key={d} className="block">
            <span className="block text-caption text-text-muted mb-1">{VERIFICATION_LABEL[d]}</span>
            <select
              className={`${inputClass} h-10 ${member.verification[d] === 'verified' ? 'text-verified' : member.verification[d] === 'pending' ? 'text-text' : 'text-text-secondary'}`}
              value={member.verification[d]}
              disabled={busy}
              onChange={(e) => void run(() => api.verification.admin.set(member.id, d, e.target.value as VerificationState))}
            >
              {VERIFICATION_STATES.map((s) => (
                <option key={s} value={s}>
                  {VERIFICATION_STATE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {error ? (
        <div className="mt-3">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}
      <div className="mt-4 flex justify-end">
        {member.suspended ? (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => api.verification.admin.setSuspended(member.id, false))}>
            Reinstate
          </Button>
        ) : (
          <Button size="sm" variant="danger" disabled={busy} onClick={() => window.confirm(`Suspend ${member.firstName}? They will disappear from discovery and the feed.`) && void run(() => api.verification.admin.setSuspended(member.id, true))}>
            Suspend
          </Button>
        )}
      </div>
    </article>
  );
}

export function AdminMembers() {
  usePageTitle('Members');
  const [search, setSearch] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api.verification.admin.listMembers({ search, pendingOnly }), [search, pendingOnly]);
  return (
    <div data-testid="admin-members">
      <h1 className="font-display text-title leading-[34px] text-text mb-6">Members</h1>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative max-w-sm flex-1">
          <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, employer, school, area" aria-label="Search members" className={`${inputClass} h-11 pl-10`} />
        </div>
        <Checkbox label="Pending review only" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} className="min-h-0 py-0" />
      </div>
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice tone="danger">{error}</Notice>
      ) : !data || data.length === 0 ? (
        <EmptyState title="No members match." />
      ) : (
        <div className="space-y-3">
          {data.map((m) => (
            <MemberCard key={m.id} member={m} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
