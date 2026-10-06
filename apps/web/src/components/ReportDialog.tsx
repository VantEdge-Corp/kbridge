import { useState } from 'react';
import { REPORT_REASONS } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { SelectField, TextareaField } from '@/components/form';
import { Notice } from '@/components/Notice';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { api, errorMessage } from '@/lib/api';

const REASON_OPTIONS = REPORT_REASONS.map((r) => ({ value: r, label: r }));

export function ReportDialog({
  open,
  onClose,
  reportedId,
  reportedName,
  matchId,
  postId,
}: {
  open: boolean;
  onClose: () => void;
  reportedId: string;
  reportedName: string;
  matchId?: string | null;
  postId?: string | null;
}) {
  const { user } = useMember();
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setDetail('');
    setError(null);
    onClose();
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.safety.report({ reporterId: user.id, reportedId, reason, detail, matchId: matchId ?? null, postId: postId ?? null });
      toast.add({
        title: 'Report received',
        description: 'Thank you. Our team reviews every report and acts on it. Consider blocking this member if you would rather not hear from them.',
        type: 'success',
      });
      close();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{postId ? 'Report this post' : `Report ${reportedName}`}</DialogTitle>
          <DialogDescription>Reports are private. {reportedName} is never told who reported them.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <SelectField label="Reason" options={REASON_OPTIONS} value={reason} onValueChange={(v) => setReason(v || REPORT_REASONS[0])} />
          <TextareaField label="Details" optional value={detail} onChange={(e) => setDetail(e.target.value)} rows={4} maxLength={1000} />
          {error ? <Notice tone="danger">{error}</Notice> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            Send report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
