import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import type { PublicProfile } from '@peaches/core';
import { IntroductionNoteSheet } from '@/components/IntroductionNoteSheet';
import { ReportSheet } from '@/components/ReportSheet';
import { ActionSheet, type SheetAction } from '@/components/Sheet';
import { api } from '@/lib/api';
import { useMember } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';

/**
 * The member menu a long-press on a card or row opens: view, request an
 * introduction, report, block. The web shows the same entries on right-click
 * and behind each card's ⋯ button. Render `sheets` once beside the list.
 */
export function usePersonActions({ onBlocked, canRequest = () => true }: { onBlocked?: (id: string) => void; canRequest?: (person: PublicProfile) => boolean } = {}) {
  const router = useRouter();
  const { userId } = useMember();
  const [menuFor, setMenuFor] = useState<PublicProfile | null>(null);
  const [introFor, setIntroFor] = useState<PublicProfile | null>(null);
  const [reportFor, setReportFor] = useState<PublicProfile | null>(null);

  const block = useCallback(
    (person: PublicProfile) => {
      Alert.alert(`Block ${person.firstName}?`, 'You will no longer see each other anywhere in Peaches.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.safety.block(userId, person.id);
              onBlocked?.(person.id);
            } catch (e) {
              Alert.alert('Could not block', errorMessage(e));
            }
          },
        },
      ]);
    },
    [userId, onBlocked],
  );

  const fileReport = async (reason: string) => {
    const person = reportFor;
    setReportFor(null);
    if (!person) return;
    try {
      await api.safety.report({ reporterId: userId, reportedId: person.id, reason });
      Alert.alert('Report received', 'Our team will review it.');
    } catch (e) {
      Alert.alert('Could not report', errorMessage(e));
    }
  };

  const sendRequest = async (note: string) => {
    const person = introFor;
    if (!person) return;
    await api.introductions.request({ viewerId: userId, recipientId: person.id, note });
    setIntroFor(null);
    Alert.alert('Request sent', `${person.firstName} will see your note in their inbox.`);
  };

  const actions: SheetAction[] = menuFor
    ? [
        { label: 'View profile', icon: 'user', onPress: () => router.push({ pathname: '/profile/[id]', params: { id: menuFor.id } }) },
        ...(canRequest(menuFor) ? [{ label: 'Request introduction', icon: 'mail' as const, onPress: () => setIntroFor(menuFor) }] : []),
        { label: `Report ${menuFor.firstName}`, icon: 'flag', destructive: true, onPress: () => setReportFor(menuFor) },
        { label: `Block ${menuFor.firstName}`, icon: 'ban', destructive: true, onPress: () => block(menuFor) },
      ]
    : [];

  const sheets = (
    <>
      <ActionSheet visible={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor?.firstName} actions={actions} />
      <IntroductionNoteSheet visible={!!introFor} onClose={() => setIntroFor(null)} recipientFirstName={introFor?.firstName ?? ''} onSubmit={sendRequest} />
      <ReportSheet visible={!!reportFor} onClose={() => setReportFor(null)} onSelect={(reason) => void fileReport(reason)} title={`Report ${reportFor?.firstName ?? ''}`} />
    </>
  );

  return { open: setMenuFor, sheets };
}
