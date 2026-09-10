import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgo, truncate, type IntroductionRequest } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { PageHeader } from '../components/AppShell';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Notice } from '../components/Field';
import { InboxRow } from '../components/InboxRow';
import { LoadingBlock } from '../components/Loading';
import { SectionHeader } from '../components/SectionHeader';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

type Tab = 'requests' | 'connections' | 'messages';

export function Inbox() {
  usePageTitle('Inbox');
  const { user } = useMember();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('requests');
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
    <div className="max-w-[720px]">
      <PageHeader title="Inbox" />
      <SegmentedTabs segments={segments} value={tab} onChange={setTab} className="mb-2" />
      {actionError ? (
        <div className="my-3">
          <Notice tone="danger">{actionError}</Notice>
        </div>
      ) : null}
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <div className="space-y-3 mt-4">
          <Notice tone="danger">{error}</Notice>
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : tab === 'requests' ? (
        <div className="space-y-8 mt-2">
          <section>
            {data && data.incoming.length === 0 ? (
              <EmptyState title="No requests waiting." body="When someone asks to be introduced, their note appears here." />
            ) : (
              data?.incoming.map((r) => (
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
                      <p className="text-body-sm text-text whitespace-pre-wrap border-l border-border pl-3">{r.note}</p>
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
              ))
            )}
          </section>
          {data && data.outgoing.length > 0 ? (
            <section>
              <SectionHeader title="Sent by you" />
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
                      <p className="text-body-sm text-text-secondary whitespace-pre-wrap border-l border-border pl-3">{r.note}</p>
                      <Button size="sm" variant="secondary" onClick={() => void act(async () => { await api.introductions.withdraw(r.id); reload(); })}>
                        Withdraw
                      </Button>
                    </div>
                  ) : null}
                </InboxRow>
              ))}
            </section>
          ) : null}
        </div>
      ) : tab === 'connections' ? (
        <div className="mt-2">
          {fresh.length === 0 ? (
            <EmptyState title="No new connections." body="Accepted introductions that haven't started talking yet appear here." />
          ) : (
            fresh.map((c) => (
              <InboxRow key={c.matchId} testId="connection-row" profileId={c.counterpart.id} name={c.counterpart.firstName} photo={c.counterpart.photos[0] ?? null} verified={c.counterpart.publicVerificationBadges.length > 0} secondary="Say hello" time={timeAgo(c.createdAt)} to={`/chat/${c.matchId}`} />
            ))
          )}
        </div>
      ) : (
        <div className="mt-2">
          {threads.length === 0 ? (
            <EmptyState title="No conversations yet." body="Once a connection starts talking, the thread lives here." />
          ) : (
            threads.map((c) => (
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
                to={`/chat/${c.matchId}`}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
