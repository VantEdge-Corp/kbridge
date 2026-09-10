import { useState } from 'react';
import { LIMITS, validateIntroNote, type PublicProfile } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Notice, TextArea } from './Field';

/** "Interested" / "Request conversation": one restrained note, then a pending request. */
export function IntroductionNoteDialog({
  open,
  onClose,
  recipient,
  postId,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  recipient: PublicProfile;
  postId?: string | null;
  onSent?: () => void;
}) {
  const { user } = useMember();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const problem = validateIntroNote(note);

  const submit = async () => {
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.introductions.request({ viewerId: user.id, recipientId: recipient.id, note, postId: postId ?? null });
      setNote('');
      onSent?.();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Introduce yourself to ${recipient.firstName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy || !!problem}>
            {busy ? 'Sending' : 'Send request'}
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-text-muted mb-3">
        {recipient.firstName} will see your note with your profile and can accept or decline. A short, specific note reads best.
      </p>
      <TextArea
        label="Your note"
        hint={`${note.trim().length}/${LIMITS.introNoteMax}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={LIMITS.introNoteMax}
        rows={5}
        placeholder="What caught your attention, and what would you like to talk about?"
      />
      {error ? (
        <div className="mt-3">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}
    </Dialog>
  );
}
