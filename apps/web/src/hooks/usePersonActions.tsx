import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { LuBan, LuExternalLink, LuFlag, LuLink, LuMail, LuUser } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import type { PublicProfile } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import type { MenuAction } from '@/components/ActionMenu';
import { useConfirm } from '@/components/ConfirmProvider';
import { IntroductionNoteDialog } from '@/components/IntroductionNoteDialog';
import { ReportDialog } from '@/components/ReportDialog';
import { toast } from '@/components/ui/toast';
import { api, errorMessage } from '@/lib/api';

async function copyProfileLink(href: string) {
  const url = `${window.location.origin}${href}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.add({ title: 'Link copied', type: 'success' });
  } catch {
    toast.add({ title: 'Could not copy the link', description: url, type: 'error' });
  }
}

/**
 * Everything a member can do to another member from a card, a row, or a
 * profile: the menu entries plus the dialogs they open. Render `dialogs` once
 * next to the list. `onBlocked` lets the list drop that member immediately.
 */
export function usePersonActions({ onBlocked }: { onBlocked?: (id: string) => void } = {}) {
  const { user } = useMember();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [requested, setRequested] = useState<ReadonlySet<string>>(new Set());
  const [intro, setIntro] = useState<PublicProfile | null>(null);
  const [report, setReport] = useState<PublicProfile | null>(null);

  useEffect(() => {
    let active = true;
    api.introductions
      .activeCounterpartIds(user.id)
      .then((ids) => {
        if (active) setRequested(ids);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user.id]);

  const block = useCallback(
    async (person: PublicProfile) => {
      const ok = await confirm({
        title: `Block ${person.firstName}?`,
        description: 'You will no longer see each other anywhere in Peaches. You can unblock from Settings.',
        confirmLabel: 'Block',
        destructive: true,
      });
      if (!ok) return;
      try {
        await api.safety.block(user.id, person.id);
        toast.add({ title: `${person.firstName} is blocked`, type: 'success' });
        onBlocked?.(person.id);
      } catch (e) {
        toast.add({ title: 'Could not block', description: errorMessage(e), type: 'error' });
      }
    },
    [confirm, user.id, onBlocked],
  );

  /** On the profile itself (`onProfile`) the entries that open it give way to copying its link. */
  const actionsFor = useCallback(
    (person: PublicProfile, { onProfile = false }: { onProfile?: boolean } = {}): MenuAction[] => {
      const href = `/profile/${person.id}`;
      const copyLink: MenuAction = { label: 'Copy profile link', icon: LuLink, onSelect: () => void copyProfileLink(href) };
      if (person.id === user.id) return onProfile ? [copyLink] : [{ label: 'View your profile', icon: LuUser, onSelect: () => navigate(href) }];
      const actions: MenuAction[] = onProfile
        ? [copyLink]
        : [
            { label: 'View profile', icon: LuUser, onSelect: () => navigate(href) },
            { label: 'Open in new tab', icon: LuExternalLink, onSelect: () => window.open(href, '_blank', 'noopener') },
          ];
      // The profile page has its own Interested button.
      if (!onProfile && !requested.has(person.id)) actions.push({ label: 'Request introduction', icon: LuMail, onSelect: () => setIntro(person) });
      actions.push(
        { label: `Report ${person.firstName}`, icon: LuFlag, onSelect: () => setReport(person), destructive: true, separated: true },
        { label: `Block ${person.firstName}`, icon: LuBan, onSelect: () => void block(person), destructive: true },
      );
      return actions;
    },
    [user.id, navigate, requested, block],
  );

  const dialogs: ReactNode = (
    <>
      {intro ? (
        <IntroductionNoteDialog
          open
          onClose={() => setIntro(null)}
          recipient={intro}
          onSent={() => setRequested((ids) => new Set(ids).add(intro.id))}
        />
      ) : null}
      {report ? <ReportDialog open onClose={() => setReport(null)} reportedId={report.id} reportedName={report.firstName} /> : null}
    </>
  );

  return { actionsFor, dialogs, requested, requestIntroduction: setIntro, reportMember: setReport, blockMember: block };
}
