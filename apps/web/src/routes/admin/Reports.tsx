import { useState } from 'react';
import { LuFlag } from 'react-icons/lu';
import { longDate, type Report, type ReportStatus } from '@peaches/core';
import { PageHeader } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { RowsSkeleton } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';

const TABS: ReadonlyArray<{ key: ReportStatus | 'all'; label: string }> = [
  { key: 'open', label: 'Open' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'actioned', label: 'Actioned' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: 'all', label: 'All' },
];

const STATUS_LABEL: Record<ReportStatus, string> = { open: 'Open', reviewed: 'Reviewed', actioned: 'Actioned', dismissed: 'Dismissed' };

function ReportCard({ report, onChanged }: { report: Report; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = async (status: ReportStatus) => {
    setBusy(true);
    setError(null);
    try {
      await api.safety.admin.updateReportStatus(report.id, status);
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {report.reported.firstName}
          <span className="text-sm font-normal text-muted-foreground">reported by {report.reporter?.firstName ?? 'a former member'}</span>
          <Badge variant={report.status === 'open' ? 'default' : 'secondary'} className="ml-auto">
            {STATUS_LABEL[report.status]}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {longDate(report.createdAt)} · {report.matchId ? 'From a conversation' : report.postId ? 'About a post' : 'From a profile'}
        </p>
      </CardHeader>
      <CardContent className="gap-1">
        <p className="text-sm font-medium">{report.reason}</p>
        {report.detail ? <p className="text-sm whitespace-pre-wrap text-muted-foreground">{report.detail}</p> : null}
        {error ? <Notice tone="danger" className="mt-3">{error}</Notice> : null}
      </CardContent>
      <CardFooter className="flex-wrap gap-2 border-t">
        {(['reviewed', 'actioned', 'dismissed'] as const)
          .filter((s) => s !== report.status)
          .map((s) => (
            <Button key={s} size="sm" variant={s === 'actioned' ? 'default' : 'outline'} disabled={busy} onClick={() => void set(s)}>
              Mark {s}
            </Button>
          ))}
      </CardFooter>
    </Card>
  );
}

export function AdminReports() {
  usePageTitle('Reports');
  const [tab, setTab] = useState<ReportStatus | 'all'>('open');
  const { data, loading, error, reload } = useAsync(() => api.safety.admin.listReports(), []);
  const visible = data?.filter((r) => tab === 'all' || r.status === tab) ?? [];
  return (
    <div data-testid="admin-reports">
      <PageHeader title="Reports" description="The Terms promise every report is reviewed within 24 hours, child safety first." />
      <Tabs value={tab} onValueChange={(value) => setTab(value as ReportStatus | 'all')} className="mb-6">
        <TabsList className="max-w-full overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {loading ? (
        <RowsSkeleton avatar={false} />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState icon={LuFlag} title="No reports." body={tab === 'open' ? 'Nothing waiting for review.' : undefined} />
      ) : (
        <div className="grid gap-3">
          {visible.map((r) => (
            <ReportCard key={r.id} report={r} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
