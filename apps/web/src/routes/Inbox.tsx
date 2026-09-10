import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { timeAgo, truncate, type IntroductionRequest } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Notice } from '../components/Field';
import { Group } from '../components/Group';
import { Icon } from '../components/icons';
import { InboxRow } from '../components/InboxRow';
import { LoadingBlock } from '../components/Loading';
import { SectionHeader } from '../components/SectionHeader';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { useAsync } from '../hooks/useAsync';
import { useIsWide } from '../hooks/useMediaQuery';
import { usePageTitle } from '../hooks/usePageTitle';
import { ChatPane } from './Chat';

type Tab = 'requests' | 'connections' | 'messages';

/** The three inbox sections as one list. Highlights `activeMatchId` in the two-pane layout. */
export function InboxList({ activeMatchId }: { activeMatchId: string | null }) {
  usePageTitle('Inbox');
  const { user } = useMember();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(activeMatchId ? 'messages' : 'requests');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, loading, error, reload } = useAsync(async () => {
    const [incoming, outgoing, connections] = await Promise.all([
      api.introductions.listIncoming(user.id),
      api.introductions.listOutgoing(user.id),
      api.connections.list(user.id),
    ]);
    return { incoming, outgoing, connections };
  }, [user.id]);

  const matchKey = data?.connections.map((c) => c.matchId).join(',') ?? '';
  useEffect(() => {
    const offRequests = api.introductions.subscribeIncoming(user.id, reload);
    const offInbox = api.connections.subscribeInbox(matchKey ? matchKey.split(',') : [], reload);
    return () => {
      offRequests();
      offInbox();
    };
  }, [user.id, matchKey, reload]);

  const act = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  const accept = (r: IntroductionRequest) =>
    act(async () => {
      const matchId = await api.introductions.accept(r.id);
      navigate(`/chat/${matchId}`);
    });

  const fresh = data?.connections.filter((c) => !c.lastMessage) ?? [];
  const threads = data?.connections.filter((c) => !!c.lastMessage) ?? [];
  const unreadTotal = threads.reduce((n, c) => n + c.unreadCount, 0);

  const segments = [
    { key: 'requests' as const, label: 'Requests', count: data?.incoming.length },
    { key: 'connections' as const, label: 'Connections', count: fresh.length },
    { key: 'messages' as const, label: 'Messages', count: unreadTotal },
  ];

  return (
    <div>
      <PageHeader title="Inbox" />
      <SegmentedTabs segments={segments} value={tab} onChange={setTab} className="mb-4" />
      {actionError ? (
        <div className="mb-3">
          <Notice tone="danger">{actionError}</Notice>
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
      ) : tab === 'requests' ? (
        <div className="space-y-8">
          <section>
            {data && data.incoming.length === 0 ? (
              <EmptyState title="No requests waiting." body="When someone asks to be introduced, their note appears here." />
            ) : (
              <Group>
                {data?.incoming.map((r) => (
                  <InboxRow
                    key={r.id}
                    testId="request-row"
                    profileId={r.counterpart.id}
                    name={r.counterpart.firstName}
                    photo={r.counterpart.photos[0] ?? null}
                    verified={r.counterpart.publicVerificationBadges.length > 0}
                    secondary={truncate(r.note, 80)}
                    time={timeAgo(r.createdAt)}
                    onClick={() => setExpanded((cur) => (cur === r.id ? null : r.id))}
                  >
                    {expanded === r.id ? (
                      <div className="space-y-3">
                        <p className="text-body-sm text-text whitespace-pre-wrap">{r.note}</p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => void accept(r)}>
                            Accept
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void act(async () => { await api.introductions.decline(r.id); reload(); })}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </InboxRow>
                ))}
              </Group>
            )}
          </section>
          {data && data.outgoing.length > 0 ? (
            <section>
              <SectionHeader title="Sent by you" />
              <Group>
                {data.outgoing.map((r) => (
                  <InboxRow
                    key={r.id}
                    profileId={r.counterpart.id}
                    name={r.counterpart.firstName}
                    photo={r.counterpart.photos[0] ?? null}
                    verified={r.counterpart.publicVerificationBadges.length > 0}
                    secondary="Waiting for a reply"
                    time={timeAgo(r.createdAt)}
                    onClick={() => setExpanded((cur) => (cur === r.id ? null : r.id))}
                  >
                    {expanded === r.id ? (
                      <div className="space-y-3">
                        <p className="text-body-sm text-text-secondary whitespace-pre-wrap">{r.note}</p>
                        <Button size="sm" variant="secondary" onClick={() => void act(async () => { await api.introductions.withdraw(r.id); reload(); })}>
                          Withdraw
                        </Button>
                      </div>
                    ) : null}
                  </InboxRow>
                ))}
              </Group>
            </section>
          ) : null}
        </div>
      ) : tab === 'connections' ? (
        fresh.length === 0 ? (
          <EmptyState title="No new connections." body="Accepted introductions that haven't started talking yet appear here." />
        ) : (
          <Group>
            {fresh.map((c) => (
              <InboxRow
                key={c.matchId}
                testId="connection-row"
                profileId={c.counterpart.id}
                name={c.counterpart.firstName}
                photo={c.counterpart.photos[0] ?? null}
                verified={c.counterpart.publicVerificationBadges.length > 0}
                secondary="Say hello"
                time={timeAgo(c.createdAt)}
                active={c.matchId === activeMatchId}
                to={`/chat/${c.matchId}`}
              />
            ))}
          </Group>
        )
      ) : threads.length === 0 ? (
        <EmptyState title="No conversations yet." body="Once a connection starts talking, the thread lives here." />
      ) : (
        <Group>
          {threads.map((c) => (
            <InboxRow
              key={c.matchId}
              testId="thread-row"
              profileId={c.counterpart.id}
              name={c.counterpart.firstName}
              photo={c.counterpart.photos[0] ?? null}
              verified={c.counterpart.publicVerificationBadges.length > 0}
              secondary={`${c.lastMessage?.senderId === user.id ? 'You: ' : ''}${truncate(c.lastMessage?.body ?? '', 70)}`}
              time={c.lastMessage ? timeAgo(c.lastMessage.createdAt) : undefined}
              unread={c.unreadCount}
              active={c.matchId === activeMatchId}
              to={`/chat/${c.matchId}`}
            />
          ))}
        </Group>
      )}
    </div>
  );
}

function ChoosePlaceholder() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6" data-testid="inbox-placeholder">
      <span className="text-text-faint">
        <Icon name="inbox" size={28} />
      </span>
      <p className="mt-4 text-body text-text-secondary">Choose a conversation.</p>
      <p className="mt-1 text-body-sm text-text-muted max-w-xs">Requests, new connections, and messages are on the left.</p>
    </div>
  );
}

/**
 * /inbox and /chat/:matchId. Two panes from 1024px: the list on the left and
 * the conversation, or a calm placeholder, on the right. Narrower screens
 * show one at a time.
 */
export function Inbox() {
  const { matchId } = useParams();
  const wide = useIsWide();

  if (wide) {
    return (
      <div className="h-full min-h-0 grid grid-cols-[360px_1fr]" data-testid="inbox-split">
        <aside className="h-full min-h-0 overflow-y-auto border-r border-border pr-6 pt-8 pb-8">
          <InboxList activeMatchId={matchId ?? null} />
        </aside>
        <section className="h-full min-h-0 min-w-0 pl-6">{matchId ? <ChatPane key={matchId} matchId={matchId} /> : <ChoosePlaceholder />}</section>
      </div>
    );
  }
  if (matchId) return <ChatPane key={matchId} matchId={matchId} showBack />;
  return (
    <div className="h-full min-h-0 overflow-y-auto pt-6 pb-6">
      <InboxList activeMatchId={null} />
    </div>
  );
}
