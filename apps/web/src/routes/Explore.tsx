import { useEffect, useMemo, useState } from 'react';
import { LuSearchX, LuSlidersHorizontal } from 'react-icons/lu';
import { rankForYou, type Preferences } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { LoadingBlock, PersonGridSkeleton } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { PersonGrid } from '@/components/PersonCard';
import { PreferencesEditor, type LocationSettings } from '@/components/PreferencesEditor';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { useAsync } from '@/hooks/useAsync';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, errorMessage } from '@/lib/api';

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
      toast.add({ title: 'Preferences saved', description: 'Home and Explore now use them.', type: 'success' });
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
        description={
          <span data-testid="explore-count" className="tabular-nums">
            {countLabel}
          </span>
        }
        actions={
          isDesktop ? (
            <Button onClick={() => void save()} disabled={!dirty || saving}>
              {saving ? <Spinner data-icon="inline-start" /> : null}
              {savedAt && !dirty ? 'Saved' : 'Save preferences'}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setPanelOpen(true)}>
              <LuSlidersHorizontal data-icon="inline-start" />
              Filters
            </Button>
          )
        }
      />
      {saveError ? <Notice tone="danger" className="mb-6">{saveError}</Notice> : null}
      <div className="md:grid md:grid-cols-[320px_1fr] md:gap-8 lg:grid-cols-[360px_1fr] lg:gap-10">
        {isDesktop ? (
          <aside className="md:sticky md:top-6 md:-mr-2 md:max-h-[calc(100dvh-48px)] md:self-start md:overflow-y-auto md:pr-2 md:pb-6" aria-label="Filters">
            {loading || !editor ? <LoadingBlock /> : editor}
          </aside>
        ) : null}
        <section aria-label="Results">
          {loading ? (
            <PersonGridSkeleton count={6} />
          ) : error ? (
            <LoadError message={error} onRetry={reload} />
          ) : results.length === 0 ? (
            <EmptyState icon={LuSearchX} title="No one matches every requirement." body="Change a Required preference to Preferred to see more people. Preferred choices still rank matches first." />
          ) : (
            <PersonGrid profiles={results.map((c) => c.profile)} />
          )}
        </section>
      </div>
      {!isDesktop ? (
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent side="bottom" className="max-h-[92dvh] gap-0 rounded-t-xl">
            <SheetHeader className="border-b">
              <SheetTitle className="font-display text-[1.75rem] leading-tight font-normal">Filters</SheetTitle>
              <SheetDescription>Required excludes anyone who doesn&apos;t match. Preferred ranks matches first.</SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto p-4">{editor ?? <LoadingBlock />}</div>
            <SheetFooter className="flex-row items-center border-t">
              <span className="mr-auto text-sm text-muted-foreground tabular-nums">{countLabel}</span>
              <Button variant="outline" onClick={() => setPanelOpen(false)}>
                Close
              </Button>
              <Button onClick={() => void save()} disabled={!dirty || saving}>
                {saving ? <Spinner data-icon="inline-start" /> : null}
                Save
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
