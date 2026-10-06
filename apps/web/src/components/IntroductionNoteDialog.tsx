import { useState } from 'react';
import { LIMITS, validateIntroNote, type PublicProfile } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { TextareaField } from '@/components/form';
import { Notice } from '@/components/Notice';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { api, errorMessage } from '@/lib/api';

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
      toast.add({ title: 'Request sent', description: `${recipient.firstName} will see your note in their inbox.`, type: 'success' });
      onSent?.();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Introduce yourself to {recipient.firstName}</DialogTitle>
          <DialogDescription>{recipient.firstName} will see your note with your profile and can accept or decline. A short, specific note reads best.</DialogDescription>
        </DialogHeader>
        <TextareaField
          label="Your note"
          hint={`${note.trim().length}/${LIMITS.introNoteMax}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={LIMITS.introNoteMax}
          rows={5}
          placeholder="What caught your attention, and what would you like to talk about?"
        />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy || !!problem}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
