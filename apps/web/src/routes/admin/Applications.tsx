import { useState } from 'react';
import { LuCheck, LuChevronDown, LuClipboardList, LuClock3, LuRotateCcw, LuSearch, LuX } from 'react-icons/lu';
import { longDate, type AdminApplicationStatus, type ApplicationRow } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { TextareaField } from '@/components/form';
import { RowsSkeleton } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';

const TABS: ReadonlyArray<{ key: AdminApplicationStatus; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'waitlisted', label: 'Deferred' },
  { key: 'approved', label: 'Admitted' },
  { key: 'claimed', label: 'Active' },
  { key: 'rejected', label: 'Declined' },
];

function Dossier({ app, onChanged }: { app: ApplicationRow; onChanged: () => void }) {
  const { user } = useMember();
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
    <Card className="gap-0 py-0" data-testid="dossier">
      <Collapsible>
        <CollapsibleTrigger className="group/dossier flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="font-medium">{app.firstName}</span>
          <span className="truncate text-sm text-muted-foreground">{[app.occupation, app.company, app.city].filter(Boolean).join(' · ')}</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">{longDate(app.createdAt)}</span>
          <LuChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-panel-open/dossier:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <div className="grid gap-6 p-5">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[100px_1fr] gap-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="break-words">{v || <span className="text-muted-foreground/60">Not given</span>}</dd>
                </div>
              ))}
            </dl>
            {app.bio ? (
              <div className="grid gap-1">
                <p className="text-xs font-medium text-muted-foreground">Bio</p>
                <p className="text-sm whitespace-pre-wrap">{app.bio}</p>
              </div>
            ) : null}
            {app.why ? (
              <div className="grid gap-1">
                <p className="text-xs font-medium text-muted-foreground">Why Peaches</p>
                <p className="text-sm whitespace-pre-wrap">{app.why}</p>
              </div>
            ) : null}
            <div className="grid gap-2">
              <TextareaField label="Internal note" hint="Never shown to the applicant" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              {noteDirty ? (
                <div>
                  <Button size="sm" variant="outline" onClick={() => void saveNote()} disabled={busy}>
                    Save note
                  </Button>
                </div>
              ) : null}
            </div>
            {error ? <Notice tone="danger">{error}</Notice> : null}
            <div className="flex flex-wrap gap-2">
              {app.status !== 'claimed' && app.status !== 'approved' ? (
                <Button size="sm" onClick={() => void decide('approved')} disabled={busy}>
                  <LuCheck data-icon="inline-start" />
                  Admit
                </Button>
              ) : null}
              {app.status === 'pending' || app.status === 'rejected' ? (
                <Button size="sm" variant="outline" onClick={() => void decide('waitlisted')} disabled={busy}>
                  <LuClock3 data-icon="inline-start" />
                  Defer
                </Button>
              ) : null}
              {app.status !== 'rejected' && app.status !== 'claimed' ? (
                <Tooltip>
                  <TooltipTrigger render={<Button size="sm" variant="destructive" onClick={() => void decide('rejected')} disabled={busy} />}>
                    <LuX data-icon="inline-start" />
                    Decline (silent)
                  </TooltipTrigger>
                  <TooltipContent>The applicant is not notified</TooltipContent>
                </Tooltip>
              ) : null}
              {app.status === 'approved' || app.status === 'rejected' || app.status === 'waitlisted' ? (
                <Button size="sm" variant="ghost" onClick={() => void decide('pending')} disabled={busy}>
                  <LuRotateCcw data-icon="inline-start" />
                  Reopen
                </Button>
              ) : null}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function AdminApplications() {
  usePageTitle('Applications');
  const [status, setStatus] = useState<AdminApplicationStatus>('pending');
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useAsync(() => api.applications.admin.list({ status, search }), [status, search]);
  return (
    <div data-testid="admin-applications">
      <PageHeader title="Applications" description="Read each one; admitted applicants can create an account from their status link." />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={(value) => setStatus(value as AdminApplicationStatus)}>
          <TabsList className="max-w-full overflow-x-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <InputGroup className="sm:max-w-xs">
          <InputGroupInput type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, area, occupation" aria-label="Search applications" />
          <InputGroupAddon>
            <LuSearch />
          </InputGroupAddon>
        </InputGroup>
      </div>
      {loading ? (
        <RowsSkeleton avatar={false} />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={LuClipboardList} title="Nothing here." body="No applications with this status." />
      ) : (
        <div className="grid gap-3">
          {data.map((app) => (
            <Dossier key={app.id} app={app} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
