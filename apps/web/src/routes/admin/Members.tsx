import { useState } from 'react';
import { LuSearch, LuUsers } from 'react-icons/lu';
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
import { PageHeader } from '@/components/AppShell';
import { useConfirm } from '@/components/ConfirmProvider';
import { EmptyState } from '@/components/EmptyState';
import { CheckboxField, SelectField } from '@/components/form';
import { RowsSkeleton } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const STATE_OPTIONS = VERIFICATION_STATES.map((s) => ({ value: s, label: VERIFICATION_STATE_LABEL[s] }));

function MemberCard({ member, onChanged }: { member: AdminMember; onChanged: () => void }) {
  const confirm = useConfirm();
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
  const suspend = async () => {
    const ok = await confirm({ title: `Suspend ${member.firstName}?`, description: 'They will disappear from discovery and the feed until reinstated.', confirmLabel: 'Suspend', destructive: true });
    if (ok) void run(() => api.verification.admin.setSuspended(member.id, true));
  };
  const pending = VERIFICATION_DIMENSIONS.filter((d) => member.verification[d] === 'pending');
  return (
    <Card size="sm" className={cn(member.suspended && 'ring-destructive/40')} data-testid="member-card">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {member.firstName}
          <span className="text-xs font-normal text-muted-foreground tabular-nums">{member.memberNumber}</span>
          {member.suspended ? <Badge variant="destructive">Suspended</Badge> : null}
          {pending.length > 0 ? <Badge variant="secondary">{pending.length} pending review</Badge> : null}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{[member.occupation, member.employer, member.displayArea].filter(Boolean).join(' · ')}</p>
      </CardHeader>
      <CardContent className="gap-5">
        <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted-foreground">Education</dt>
            <dd>{[member.school, member.degreeLevel ? labelFor(DEGREE_LEVEL_OPTIONS, member.degreeLevel as DegreeLevel) : '', member.fieldOfStudy].filter(Boolean).join(' · ') || 'Not given'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted-foreground">Joined</dt>
            <dd>
              {member.createdAt ? longDate(member.createdAt) : 'Unknown'} · active {member.lastActiveAt ? timeAgo(member.lastActiveAt) : 'never'} · {member.photoCount} photos
            </dd>
          </div>
        </dl>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VERIFICATION_DIMENSIONS.map((d: VerificationDimension) => (
            <SelectField
              key={d}
              label={VERIFICATION_LABEL[d]}
              options={STATE_OPTIONS}
              value={member.verification[d]}
              disabled={busy}
              onValueChange={(v) => {
                if (v && v !== member.verification[d]) void run(() => api.verification.admin.set(member.id, d, v as VerificationState));
              }}
            />
          ))}
        </div>
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </CardContent>
      <CardFooter className="justify-end border-t">
        {member.suspended ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => api.verification.admin.setSuspended(member.id, false))}>
            Reinstate
          </Button>
        ) : (
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => void suspend()}>
            Suspend
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function AdminMembers() {
  usePageTitle('Members');
  const [search, setSearch] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api.verification.admin.listMembers({ search, pendingOnly }), [search, pendingOnly]);
  return (
    <div data-testid="admin-members">
      <PageHeader title="Members" description="Verification is set one dimension at a time. Only verified dimensions are ever shown to members." />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <InputGroup className="sm:max-w-xs">
          <InputGroupInput type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, employer, school, area" aria-label="Search members" />
          <InputGroupAddon>
            <LuSearch />
          </InputGroupAddon>
        </InputGroup>
        <CheckboxField label="Pending review only" checked={pendingOnly} onCheckedChange={setPendingOnly} className="w-auto" />
      </div>
      {loading ? (
        <RowsSkeleton avatar={false} />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={LuUsers} title="No members match." />
      ) : (
        <div className="grid gap-3">
          {data.map((m) => (
            <MemberCard key={m.id} member={m} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
