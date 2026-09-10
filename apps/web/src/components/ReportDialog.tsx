import { useState } from 'react';
import { REPORT_REASONS } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Notice, Select, TextArea } from './Field';

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
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.safety.report({ reporterId: user.id, reportedId, reason, detail, matchId: matchId ?? null, postId: postId ?? null });
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setDone(false);
    setDetail('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={done ? 'Report received' : `Report ${reportedName}`}
      footer={
        done ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={busy}>
              {busy ? 'Sending' : 'Send report'}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <p className="text-body-sm text-text-secondary">Thank you. Our team reviews every report and acts on it. Consider blocking this member if you would rather not hear from them.</p>
      ) : (
        <div className="space-y-4">
          <Select label="Reason" options={REPORT_REASONS.map((r) => ({ value: r, label: r }))} value={reason} onChange={(e) => setReason(e.target.value)} />
          <TextArea label="Details" optional value={detail} onChange={(e) => setDetail(e.target.value)} rows={4} maxLength={1000} />
          {error ? <Notice tone="danger">{error}</Notice> : null}
        </div>
      )}
    </Dialog>
  );
}
