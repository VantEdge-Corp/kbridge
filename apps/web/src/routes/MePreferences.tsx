import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Preferences } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { LoadingBlock } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { PreferencesEditor, type LocationSettings } from '@/components/PreferencesEditor';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';

export function MePreferences() {
  usePageTitle('Discovery preferences');
  const { user, email } = useMember();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(async () => {
    const [prefs, priv] = await Promise.all([api.profiles.getPreferences(user.id), api.profiles.getPrivate(user.id, email)]);
    return { prefs, location: { areaId: priv.areaId, maxDistanceMiles: priv.maxDistanceMiles } as LocationSettings };
  }, [user.id]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [location, setLocation] = useState<LocationSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setPrefs(data.prefs);
      setLocation(data.location);
    }
  }, [data]);

  const save = async () => {
    if (!prefs || !location) return;
    setBusy(true);
    setSaveError(null);
    try {
      await api.profiles.savePreferences(user.id, prefs);
      await api.profiles.updatePrivate(user.id, { areaId: location.areaId, maxDistanceMiles: location.maxDistanceMiles });
      toast.add({ title: 'Preferences saved', description: 'Home and Explore now use them.', type: 'success' });
      navigate('/me');
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader title="Discovery preferences" back="/me" description="Required excludes anyone who doesn't match. Preferred ranks matches first. Any leaves the dimension out." />
      {error ? (
        <LoadError message={error} onRetry={reload} />
      ) : loading || !prefs || !location ? (
        <LoadingBlock />
      ) : (
        <>
          <PreferencesEditor prefs={prefs} onChange={setPrefs} location={location} onLocationChange={setLocation} />
          {saveError ? <Notice tone="danger" className="mt-4">{saveError}</Notice> : null}
          <div className="sticky bottom-16 z-10 -mx-4 mt-6 flex justify-end gap-2 border-t bg-background px-4 py-3 md:bottom-0 md:mx-0 md:rounded-xl md:border md:px-4">
            <Button variant="ghost" onClick={() => navigate('/me')} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Save preferences
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
