import { useState, type FormEvent } from 'react';
import { LuImagePlus, LuX } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { LIMITS } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { TextareaField } from '@/components/form';
import { Notice } from '@/components/Notice';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

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
      toast.add({ title: 'Posted', type: 'success' });
      navigate('/feed', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[680px]">
      <PageHeader title="New post" back="/feed" />
      <form onSubmit={(e) => void onSubmit(e)} className="grid gap-6">
        <Card>
          <CardContent className="gap-5">
            <TextareaField
              label="What's on your mind"
              hint={`${body.length}/${LIMITS.postBodyMax}`}
              maxLength={LIMITS.postBodyMax}
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              autoFocus
              placeholder="A plan, a question, something you noticed around town."
            />
            {preview ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img src={preview} alt="" className="size-full object-cover" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset" />
                <Button type="button" size="sm" variant="secondary" className="absolute top-2 right-2 shadow-sm" onClick={() => choose(null)}>
                  <LuX data-icon="inline-start" />
                  Remove
                </Button>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <label className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50')}>
                <LuImagePlus data-icon="inline-start" />
                {file ? 'Change photo' : 'Add a photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => choose(e.target.files?.[0] ?? null)} />
              </label>
              <span className="text-sm text-muted-foreground">Optional. JPEG, PNG, or WebP up to 8 MB.</span>
            </div>
          </CardContent>
        </Card>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate('/feed')}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !body.trim()}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            Post
          </Button>
        </div>
      </form>
    </div>
  );
}
