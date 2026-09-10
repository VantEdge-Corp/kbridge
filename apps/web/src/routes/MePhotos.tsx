import { useState } from 'react';
import { LIMITS } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useAuth, useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button } from '../components/Button';
import { Notice } from '../components/Field';
import { Icon } from '../components/icons';
import { usePageTitle } from '../hooks/usePageTitle';

export function MePhotos() {
  usePageTitle('Photos');
  const { user, profile } = useMember();
  const { refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await api.profiles.addPhoto(user.id, profile.photoPaths, { body: file, contentType: file.type, size: file.size });
      await refreshProfile();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (path: string) => {
    if (!window.confirm('Remove this photo?')) return;
    setBusy(true);
    setError(null);
    try {
      await api.profiles.removePhoto(user.id, profile.photoPaths, path);
      await refreshProfile();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const makePrimary = async (path: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.profiles.reorderPhotos(user.id, [path, ...profile.photoPaths.filter((p) => p !== path)]);
      await refreshProfile();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[720px]">
      <PageHeader title="Photos" back="/me" lede={`Up to ${LIMITS.photos} photos. The first is your portrait on cards. Clear, recent, and mostly of you reads best.`} />
      {error ? (
        <div className="mb-4">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-3">
        {profile.photoPaths.map((path, i) => (
          <div key={path} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-surface">
            <img src={profile.photos[i]} alt={`Your photo ${i + 1}`} className="h-full w-full object-cover" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-image-ring" />
            {i === 0 ? <span className="absolute left-2 top-2 text-micro uppercase tracking-[1.2px] bg-canvas/80 text-text px-2 py-1 rounded-sm">Portrait</span> : null}
            <div className="absolute inset-x-2 bottom-2 flex gap-1.5">
              {i !== 0 ? (
                <Button size="sm" variant="secondary" className="flex-1 bg-canvas/85" disabled={busy} onClick={() => void makePrimary(path)}>
                  Make portrait
                </Button>
              ) : null}
              <Button size="sm" variant="danger" className="bg-canvas/85" aria-label="Remove photo" disabled={busy} onClick={() => void remove(path)}>
                <Icon name="trash" size={16} />
              </Button>
            </div>
          </div>
        ))}
        {profile.photoPaths.length < LIMITS.photos ? (
          <label className={`aspect-[3/4] rounded-lg border border-dashed border-border-strong flex flex-col items-center justify-center gap-1 text-text-muted motion hover:text-text hover:border-ivory cursor-pointer ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
            <Icon name="plus" size={20} />
            <span className="text-caption">{busy ? 'Uploading' : 'Add photo'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => void add(e.target.files?.[0] ?? null)} />
          </label>
        ) : null}
      </div>
    </div>
  );
}
