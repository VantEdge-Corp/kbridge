import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LIMITS } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button } from '../components/Button';
import { Notice, TextArea } from '../components/Field';
import { Group, GroupSection } from '../components/Group';
import { Icon } from '../components/icons';
import { usePageTitle } from '../hooks/usePageTitle';

export function PostNew() {
  usePageTitle('New post');
  const { user } = useMember();
  const navigate = useNavigate();
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.posts.create(user.id, body, file ? { body: file, contentType: file.type, size: file.size } : null);
      navigate('/feed', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[720px]">
      <PageHeader title="New post" back="/feed" />
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
        <Group>
          <GroupSection>
            <div className="space-y-4">
              <TextArea label="What's on your mind" hint={`${body.length}/${LIMITS.postBodyMax}`} maxLength={LIMITS.postBodyMax} rows={5} value={body} onChange={(e) => setBody(e.target.value)} autoFocus placeholder="A plan, a question, something you noticed around town." />
              <div>
                {preview ? (
                  <div className="relative aspect-[4/3] rounded-md overflow-hidden mb-3">
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-image-ring" />
                    <Button size="sm" variant="secondary" className="absolute top-2 right-2 bg-canvas" onClick={() => choose(null)}>
                      Remove
                    </Button>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 h-10 px-3.5 rounded-md border border-border text-body-sm text-text-secondary motion hover:bg-surface-hover hover:border-border-strong cursor-pointer">
                    <Icon name="camera" size={18} />
                    {file ? 'Change photo' : 'Add a photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => choose(e.target.files?.[0] ?? null)} />
                  </label>
                  <span className="text-body-sm text-text-muted">Optional. JPEG, PNG, or WebP up to 8 MB.</span>
                </div>
              </div>
            </div>
          </GroupSection>
        </Group>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => navigate('/feed')}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !body.trim()}>
            {busy ? 'Posting' : 'Post'}
          </Button>
        </div>
      </form>
    </div>
  );
}
