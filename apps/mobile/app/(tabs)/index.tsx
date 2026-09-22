import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HOME_SECTIONS, rankSection, type HomeSection, type PublicProfile } from '@peaches/core';
import { Button } from '@/components/Button';
import { DiscoverCard } from '@/components/DiscoverCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorText } from '@/components/ErrorText';
import { FiltersSheet } from '@/components/FiltersSheet';
import { Header, HeaderIconButton } from '@/components/Header';
import { IntroductionNoteSheet } from '@/components/IntroductionNoteSheet';
import { Loading } from '@/components/Loading';
import { ReportSheet } from '@/components/ReportSheet';
import { RequestsRow } from '@/components/RequestsRow';
import { Screen } from '@/components/Screen';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { ActionSheet } from '@/components/Sheet';
import { spacing } from '@/constants/theme';
import { useStyles, type Theme } from '@/lib/theme';
import { useCandidates } from '@/hooks/useCandidates';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { useInboxSummary } from '@/lib/inboxSummary';

const EMPTY: Record<HomeSection, string> = {
  for_you: 'You have met everyone for now',
  nearby: 'No one within your distance right now',
  new: 'No new members in the last two weeks',
  active: 'No recently active members right now',
};

/**
 * Home: one member at a time, as their full profile story. "Not now" hides
 * them for a while; "Interested" opens the written introduction. Either way
 * the next person slides in. The section tabs choose which ranking feeds it,
 * the Filters sheet (shared with Explore) decides who is in it, and a row
 * above the card leads to anyone who has asked to meet the member.
 */
export default function Home() {
  const styles = useStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useMember();
  const { viewer, areaId, candidates, loading, error, refresh, reload, reportImpressions, removeCandidate, adoptFilters } = useCandidates();
  const { incoming, reload: reloadInbox } = useInboxSummary();
  const [section, setSection] = useState<HomeSection>('for_you');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [dismissSignal, setDismissSignal] = useState(0);
  useRefreshOnFocus(() => Promise.all([refresh(), reloadInbox()]));

  const ranked = useMemo(() => (viewer ? rankSection(section, viewer, candidates).map((c) => c.profile) : []), [section, viewer, candidates]);
  const current: PublicProfile | undefined = ranked[0];

  useEffect(() => {
    if (current) reportImpressions([current.id]);
  }, [current, reportImpressions]);

  const pass = useCallback(() => {
    if (!current) return;
    const id = current.id;
    removeCandidate(id);
    setDismissSignal(0);
    api.discovery.pass(id).catch((e) => Alert.alert('Could not save that', errorMessage(e)));
  }, [current, removeCandidate]);

  const sendRequest = async (note: string) => {
    if (!current) return;
    await api.introductions.request({ viewerId: userId, recipientId: current.id, note });
    setNoteOpen(false);
    removeCandidate(current.id);
  };

  const openProfile = () => current && router.push({ pathname: '/profile/[id]', params: { id: current.id } });
  const openRequests = () => router.navigate({ pathname: '/inbox', params: { section: 'requests' } });

  const block = () => {
    if (!current) return;
    const person = current;
    Alert.alert(`Block ${person.firstName}?`, 'You will no longer see each other anywhere in Peaches.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.safety.block(userId, person.id);
            removeCandidate(person.id);
          } catch (e) {
            Alert.alert('Could not block', errorMessage(e));
          }
        },
      },
    ]);
  };

  const fileReport = async (reason: string) => {
    if (!current) return;
    try {
      await api.safety.report({ reporterId: userId, reportedId: current.id, reason });
      Alert.alert('Report received', 'Our team will review it.');
    } catch (e) {
      Alert.alert('Could not report', errorMessage(e));
    } finally {
      setReportOpen(false);
    }
  };

  return (
    <Screen>
      <Header wordmark right={<HeaderIconButton name="sliders" label="Filters" onPress={() => setFiltersOpen(true)} />} />
      <SegmentedTabs items={HOME_SECTIONS} value={section} onChange={setSection} />
      <RequestsRow requests={incoming} onPress={openRequests} />
      {loading ? (
        <Loading />
      ) : error ? (
        <View style={styles.errorWrap}>
          <ErrorText message={error} />
          <Button title="Try again" variant="secondary" size="small" onPress={reload} />
        </View>
      ) : !areaId ? (
        <EmptyState
          icon="map-pin"
          title="Set your area to see people near you"
          body="Others only ever see a coarse label like “Midtown Atlanta”."
          actionTitle="Choose area"
          onAction={() => setFiltersOpen(true)}
        />
      ) : current ? (
        <View style={styles.stack}>
          <DiscoverCard
            key={current.id}
            profile={current}
            onPass={pass}
            onInterested={() => setNoteOpen(true)}
            onOpenProfile={openProfile}
            onMore={() => setMoreOpen(true)}
            dismissSignal={dismissSignal}
          />
          <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Button title="Not now" variant="secondary" onPress={() => setDismissSignal((n) => n + 1)} style={{ flex: 1 }} />
            <Button title="Interested" onPress={() => setNoteOpen(true)} style={{ flex: 2 }} />
          </View>
        </View>
      ) : (
        <EmptyState
          icon="users"
          title={EMPTY[section]}
          body={section === 'for_you' ? 'New members appear here as they join. Widen your distance or filters to see more people.' : 'Try another section, or widen your filters.'}
          actionTitle="Edit filters"
          onAction={() => setFiltersOpen(true)}
        />
      )}

      <FiltersSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} viewer={viewer} areaId={areaId} onApplied={adoptFilters} />
      <IntroductionNoteSheet visible={noteOpen} onClose={() => setNoteOpen(false)} recipientFirstName={current?.firstName ?? ''} onSubmit={sendRequest} />
      <ActionSheet
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        actions={[
          { label: 'View full profile', onPress: openProfile },
          { label: 'Report', destructive: true, onPress: () => setReportOpen(true) },
          { label: `Block ${current?.firstName ?? ''}`, destructive: true, onPress: block },
        ]}
      />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} onSelect={fileReport} title={`Report ${current?.firstName ?? ''}`} />
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    errorWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
    stack: { flex: 1 },
    actionBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: colors.canvas,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
