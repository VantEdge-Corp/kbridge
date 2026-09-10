import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HOME_SECTIONS, rankSection, type HomeSection } from '@peaches/core';
import { EmptyState } from '@/components/EmptyState';
import { ErrorText } from '@/components/ErrorText';
import { Header } from '@/components/Header';
import { Loading } from '@/components/Loading';
import { PeopleGrid } from '@/components/PeopleGrid';
import { Screen } from '@/components/Screen';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Button } from '@/components/Button';
import { spacing, text } from '@/constants/theme';
import { useCandidates } from '@/hooks/useCandidates';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

const EMPTY: Record<HomeSection, string> = {
  for_you: 'No one new right now.',
  nearby: 'No one within your distance right now.',
  new: 'No new members in the last two weeks.',
  active: 'No recently active members right now.',
};

export default function Home() {
  const router = useRouter();
  const { viewer, areaId, candidates, loading, refreshing, error, refresh, reload, reportImpressions } = useCandidates();
  const [section, setSection] = useState<HomeSection>('for_you');
  useRefreshOnFocus(refresh);

  const people = useMemo(() => (viewer ? rankSection(section, viewer, candidates).map((c) => c.profile) : []), [section, viewer, candidates]);

  const onViewed = useCallback((ids: string[]) => reportImpressions(ids), [reportImpressions]);

  return (
    <Screen>
      <Header wordmark />
      <SegmentedTabs items={HOME_SECTIONS} value={section} onChange={setSection} />
      {loading ? (
        <Loading />
      ) : error ? (
        <View style={styles.errorWrap}>
          <ErrorText message={error} />
          <Button title="Try again" variant="secondary" size="small" onPress={reload} />
        </View>
      ) : (
        <PeopleGrid
          people={people}
          refreshing={refreshing}
          onRefresh={refresh}
          onViewed={onViewed}
          ListEmptyComponent={
            !areaId ? (
              <EmptyState
                title="Set your area to see people near you."
                body="Others only ever see a coarse label like “Midtown Atlanta”."
                actionTitle="Choose area"
                onAction={() => router.push('/me/preferences')}
              />
            ) : (
              <EmptyState title={EMPTY[section]} body={section === 'for_you' ? 'Widen your distance or preferences in Explore to see more people.' : undefined} />
            )
          }
        />
      )}
      {!loading && !error && people.length > 0 ? (
        <Text style={[text.micro, styles.count]}>{people.length} people</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  count: { position: 'absolute', right: spacing.lg, top: 16, opacity: 0.001 },
});
