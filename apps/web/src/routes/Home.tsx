import { useEffect, useMemo, useRef, useState } from 'react';
import { LuMapPin, LuUsers } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { HOME_SECTIONS, rankSection, type HomeSection } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { PersonGridSkeleton } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { PersonGrid } from '@/components/PersonCard';
import { Wordmark } from '@/components/Wordmark';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api } from '@/lib/api';

const EMPTY_COPY: Record<HomeSection, { title: string; body: string }> = {
  for_you: { title: 'No one new right now.', body: 'The community is still growing. Widen your distance or loosen a required preference to see more people.' },
  nearby: { title: 'No one nearby yet.', body: 'Try a larger distance in Explore.' },
  new: { title: 'No new members this fortnight.', body: 'Recently admitted members appear here for two weeks.' },
  active: { title: 'Quiet this week.', body: 'Members active in the last seven days appear here.' },
};

export function Home() {
  usePageTitle('Home');
  const { user, email } = useMember();
  const [section, setSection] = useState<HomeSection>('for_you');
  const { data, loading, error, reload } = useAsync(async () => {
    const [viewer, candidates, priv] = await Promise.all([api.discovery.getViewer(user.id, email), api.discovery.fetchCandidates(), api.profiles.getPrivate(user.id, email)]);
    return { viewer, candidates, areaId: priv.areaId };
  }, [user.id]);

  const ranked = useMemo(() => (data?.viewer ? rankSection(section, data.viewer, data.candidates) : []), [data, section]);

  const recorded = useRef<string>('');
  useEffect(() => {
    if (ranked.length === 0) return;
    const key = `${section}:${ranked.length}:${ranked[0]?.profile.id ?? ''}`;
    if (recorded.current === key) return;
    recorded.current = key;
    void api.discovery.recordImpressions(ranked.slice(0, 40).map((c) => c.profile.id));
  }, [ranked, section]);

  return (
    <div>
      <PageHeader
        title={
          <>
            <Wordmark className="md:hidden" />
            <span className="max-md:sr-only">Home</span>
          </>
        }
        description="People worth meeting, chosen from your preferences."
      />
      <Tabs value={section} onValueChange={(value) => setSection(value as HomeSection)} className="mb-6">
        <TabsList className="max-w-full overflow-x-auto">
          {HOME_SECTIONS.map((s) => (
            <TabsTrigger key={s.key} value={s.key} className="px-3">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {data && !data.areaId ? (
        <Notice
          title="Set your area"
          className="mb-6"
          action={
            <Link to="/me/preferences" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <LuMapPin data-icon="inline-start" />
              Choose your area
            </Link>
          }
        >
          See people nearby and let others find you. Only the area&apos;s name is ever shown.
        </Notice>
      ) : null}
      {loading ? (
        <PersonGridSkeleton />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : ranked.length === 0 ? (
        <EmptyState icon={LuUsers} title={EMPTY_COPY[section].title} body={EMPTY_COPY[section].body} />
      ) : (
        <PersonGrid profiles={ranked.map((c) => c.profile)} />
      )}
    </div>
  );
}
