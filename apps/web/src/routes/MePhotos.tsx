import { useState } from 'react';
import { LuImagePlus, LuStar, LuTrash2 } from 'react-icons/lu';
import { LIMITS } from '@peaches/core';
import { useAuth, useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { useConfirm } from '@/components/ConfirmProvider';
import { Notice } from '@/components/Notice';
import { Portrait } from '@/components/PersonAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export function MePhotos() {
  usePageTitle('Photos');
  const { user, profile } = useMember();
  const { refreshProfile } = useAuth();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refreshProfile();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const add = (file: File | null) => {
    if (!file) return;
    void run(() => api.profiles.addPhoto(user.id, profile.photoPaths, { body: file, contentType: file.type, size: file.size }));
  };

  const remove = async (path: string) => {
    const ok = await confirm({ title: 'Remove this photo?', description: 'It is deleted from your profile right away.', confirmLabel: 'Remove', destructive: true });
    if (ok) void run(() => api.profiles.removePhoto(user.id, profile.photoPaths, path));
  };

  const makePrimary = (path: string) => void run(() => api.profiles.reorderPhotos(user.id, [path, ...profile.photoPaths.filter((p) => p !== path)]));

  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader title="Photos" back="/me" description={`Up to ${LIMITS.photos} photos. The first is your portrait on cards. Clear, recent, and mostly of you reads best.`} />
      {error ? <Notice tone="danger" className="mb-6">{error}</Notice> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {profile.photoPaths.map((path, i) => (
          <div key={path} className="group/photo relative">
            <Portrait name={profile.firstName} src={profile.photos[i]} alt={`Your photo ${i + 1}`} className="aspect-[3/4] rounded-xl" />
            {i === 0 ? (
              <Badge className="absolute top-2 left-2 shadow-sm">
                <LuStar />
                Portrait
              </Badge>
            ) : null}
            <div className="absolute inset-x-2 bottom-2 flex gap-1.5">
              {i !== 0 ? (
                <Button size="sm" variant="secondary" className="flex-1 shadow-sm" disabled={busy} onClick={() => makePrimary(path)}>
                  Make portrait
                </Button>
              ) : (
                <span className="flex-1" />
              )}
              <Tooltip>
                <TooltipTrigger render={<Button size="icon-sm" variant="secondary" className="shadow-sm hover:text-destructive" aria-label="Remove photo" disabled={busy} onClick={() => void remove(path)} />}>
                  <LuTrash2 />
                </TooltipTrigger>
                <TooltipContent>Remove photo</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
        {profile.photoPaths.length < LIMITS.photos ? (
          <label
            className={cn(
              'flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
              busy && 'pointer-events-none opacity-60',
            )}
          >
            {busy ? <Spinner /> : <LuImagePlus className="size-5" />}
            <span className="font-medium">{busy ? 'Uploading' : 'Add photo'}</span>
            <span className="text-xs">JPEG, PNG, or WebP</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => add(e.target.files?.[0] ?? null)} />
          </label>
        ) : null}
      </div>
    </div>
  );
}
