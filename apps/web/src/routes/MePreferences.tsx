import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Preferences } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button } from '../components/Button';
import { Notice } from '../components/Field';
import { LoadingBlock } from '../components/Loading';
import { PreferencesEditor, type LocationSettings } from '../components/PreferencesEditor';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

export function MePreferences() {
  usePageTitle('Discovery preferences');
  const { user, email } = useMember();
  const navigate = useNavigate();
  const { data, loading, error } = useAsync(async () => {
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
      navigate('/me');
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[720px]">
      <PageHeader
        title="Discovery preferences"
        back="/me"
        lede="Required excludes anyone who doesn't match. Preferred ranks matches first. Any leaves the dimension out."
      />
      {loading || !prefs || !location ? (
        <LoadingBlock />
      ) : error ? (
        <Notice tone="danger">{error}</Notice>
      ) : (
        <>
          <PreferencesEditor prefs={prefs} onChange={setPrefs} location={location} onLocationChange={setLocation} />
          {saveError ? (
            <div className="mt-4">
              <Notice tone="danger">{saveError}</Notice>
            </div>
          ) : null}
          <div className="mt-6 flex justify-end gap-3 pb-6">
            <Button variant="ghost" onClick={() => navigate('/me')} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? 'Saving' : 'Save preferences'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
