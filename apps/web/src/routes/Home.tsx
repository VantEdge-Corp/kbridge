import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HOME_SECTIONS, rankSection, type HomeSection } from '@peaches/core';
import { api } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Notice } from '../components/Field';
import { LoadingBlock } from '../components/Loading';
import { PersonGrid } from '../components/PersonCard';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { Wordmark } from '../components/Wordmark';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

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
    const [viewer, candidates, priv] = await Promise.all([
      api.discovery.getViewer(user.id, email),
      api.discovery.fetchCandidates(),
      api.profiles.getPrivate(user.id, email),
    ]);
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
      <header className="flex items-center justify-between h-10 mb-4">
        <Wordmark />
      </header>
      <SegmentedTabs segments={HOME_SECTIONS} value={section} onChange={setSection} className="mb-6" />
      {data && !data.areaId ? (
        <div className="mb-5">
          <Notice>
            Set your area to see people nearby and let others find you.{' '}
            <Link to="/me/preferences" className="text-text underline underline-offset-2">
              Choose your area
            </Link>
          </Notice>
        </div>
      ) : null}
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <div className="space-y-3">
          <Notice tone="danger">{error}</Notice>
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : ranked.length === 0 ? (
        <EmptyState title={EMPTY_COPY[section].title} body={EMPTY_COPY[section].body} />
      ) : (
        <PersonGrid profiles={ranked.map((c) => c.profile)} />
      )}
    </div>
  );
}
