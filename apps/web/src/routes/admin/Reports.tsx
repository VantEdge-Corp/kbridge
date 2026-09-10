import { useState } from 'react';
import { longDate, type Report, type ReportStatus } from '@peaches/core';
import { api, errorMessage } from '../../lib/api';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Notice } from '../../components/Field';
import { LoadingBlock } from '../../components/Loading';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { useAsync } from '../../hooks/useAsync';
import { usePageTitle } from '../../hooks/usePageTitle';

const TABS: ReadonlyArray<{ key: ReportStatus | 'all'; label: string }> = [
  { key: 'open', label: 'Open' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'actioned', label: 'Actioned' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: 'all', label: 'All' },
];

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
    <article className="border border-border rounded-lg bg-surface p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-name text-text">{report.reported.firstName}</span>
        <span className="text-body-sm text-text-muted">reported by {report.reporter?.firstName ?? 'a former member'}</span>
        <span className="ml-auto text-caption text-text-muted">{longDate(report.createdAt)}</span>
      </div>
      <p className="mt-2 text-body-sm text-text">{report.reason}</p>
      {report.detail ? <p className="mt-1 text-body-sm text-text-secondary whitespace-pre-wrap">{report.detail}</p> : null}
      <p className="mt-2 text-caption text-text-muted">
        {report.matchId ? 'From a conversation' : report.postId ? 'About a post' : 'From a profile'} · Status: {report.status}
      </p>
      {error ? (
        <div className="mt-3">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {(['reviewed', 'actioned', 'dismissed'] as const).filter((s) => s !== report.status).map((s) => (
          <Button key={s} size="sm" variant={s === 'actioned' ? 'primary' : 'secondary'} disabled={busy} onClick={() => void set(s)}>
            Mark {s}
          </Button>
        ))}
      </div>
    </article>
  );
}

export function AdminReports() {
  usePageTitle('Reports');
  const [tab, setTab] = useState<ReportStatus | 'all'>('open');
  const { data, loading, error, reload } = useAsync(() => api.safety.admin.listReports(), []);
  const visible = data?.filter((r) => tab === 'all' || r.status === tab) ?? [];
  return (
    <div data-testid="admin-reports">
      <h1 className="font-display text-title leading-[34px] text-text mb-6">Reports</h1>
      <SegmentedTabs segments={TABS} value={tab} onChange={setTab} className="mb-4" />
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <Notice tone="danger">{error}</Notice>
      ) : visible.length === 0 ? (
        <EmptyState title="No reports." body={tab === 'open' ? 'Nothing waiting for review.' : undefined} />
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <ReportCard key={r.id} report={r} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
