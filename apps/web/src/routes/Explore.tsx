import { useEffect, useMemo, useState } from 'react';
import { rankForYou, type Preferences } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { Notice } from '../components/Field';
import { Icon } from '../components/icons';
import { LoadingBlock } from '../components/Loading';
import { PersonGrid } from '../components/PersonCard';
import { PreferencesEditor, type LocationSettings } from '../components/PreferencesEditor';
import { useAsync } from '../hooks/useAsync';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { usePageTitle } from '../hooks/usePageTitle';

export function Explore() {
  usePageTitle('Explore');
  const { user, email } = useMember();
  const isDesktop = useIsDesktop();
  const { data, loading, error, reload } = useAsync(async () => {
    const [viewer, candidates, priv, prefs] = await Promise.all([
      api.discovery.getViewer(user.id, email),
      api.discovery.fetchCandidates(),
      api.profiles.getPrivate(user.id, email),
      api.profiles.getPreferences(user.id),
    ]);
    return { viewer, candidates, prefs, location: { areaId: priv.areaId, maxDistanceMiles: priv.maxDistanceMiles } as LocationSettings };
  }, [user.id]);

  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [location, setLocation] = useState<LocationSettings | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (data) {
      setPrefs(data.prefs);
      setLocation(data.location);
    }
  }, [data]);

  const results = useMemo(() => {
    if (!data?.viewer || !prefs || !location) return [];
    return rankForYou({ ...data.viewer, preferences: prefs, maxDistanceMiles: location.maxDistanceMiles }, data.candidates);
  }, [data, prefs, location]);

  const dirty = !!data && !!prefs && !!location && (JSON.stringify(prefs) !== JSON.stringify(data.prefs) || JSON.stringify(location) !== JSON.stringify(data.location));

  const save = async () => {
    if (!prefs || !location || !data) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.profiles.savePreferences(user.id, prefs);
      const locationChanged = JSON.stringify(location) !== JSON.stringify(data.location);
      if (locationChanged) await api.profiles.updatePrivate(user.id, { areaId: location.areaId, maxDistanceMiles: location.maxDistanceMiles });
      setSavedAt(Date.now());
      setPanelOpen(false);
      reload();
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const editor = prefs && location ? <PreferencesEditor prefs={prefs} onChange={setPrefs} location={location} onLocationChange={setLocation} /> : null;
  const countLabel = loading ? 'Loading' : `${results.length} ${results.length === 1 ? 'person' : 'people'}`;

  return (
    <div>
      <PageHeader
        title="Explore"
        actions={
          <>
            <span className="text-body-sm text-text-muted" data-testid="explore-count">
              {countLabel}
            </span>
            {isDesktop ? (
              <Button size="sm" onClick={() => void save()} disabled={!dirty || saving}>
                {saving ? 'Saving' : savedAt && !dirty ? 'Saved' : 'Save preferences'}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setPanelOpen(true)}>
                <Icon name="sliders" size={16} />
                Filters
              </Button>
            )}
          </>
        }
      />
      {saveError ? (
        <div className="mb-4">
          <Notice tone="danger">{saveError}</Notice>
        </div>
      ) : null}
      <div className="md:grid md:grid-cols-[340px_1fr] md:gap-8 lg:gap-10">
        {isDesktop ? (
          <aside className="md:sticky md:top-8 md:self-start md:max-h-[calc(100dvh-64px)] md:overflow-y-auto md:pr-1 md:-mr-1" aria-label="Filters">
            {loading || !editor ? <LoadingBlock /> : editor}
          </aside>
        ) : null}
        <section aria-label="Results">
          {loading ? (
            <LoadingBlock />
          ) : error ? (
            <div className="space-y-3">
              <Notice tone="danger">{error}</Notice>
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
            </div>
          ) : results.length === 0 ? (
            <EmptyState title="No one matches every requirement." body="Change a Required preference to Preferred to see more people. Preferred choices still rank matches first." />
          ) : (
            <PersonGrid profiles={results.map((c) => c.profile)} />
          )}
        </section>
      </div>
      {!isDesktop ? (
        <Dialog
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          title="Filters"
          wide
          footer={
            <>
              <span className="mr-auto self-center text-body-sm text-text-muted">{countLabel}</span>
              <Button variant="ghost" onClick={() => setPanelOpen(false)}>
                Close
              </Button>
              <Button onClick={() => void save()} disabled={!dirty || saving}>
                {saving ? 'Saving' : 'Save'}
              </Button>
            </>
          }
        >
          {editor ?? <LoadingBlock />}
        </Dialog>
      ) : null}
    </div>
  );
}
