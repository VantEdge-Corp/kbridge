import { useEffect, useState } from 'react';
import { LuBan, LuFlag, LuInbox, LuMessageCircle, LuMessagesSquare, LuUndo2, LuUser, LuUsers } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import { timeAgo, truncate, type Connection, type IntroductionRequest } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { PageHeader } from '@/components/AppShell';
import type { MenuAction } from '@/components/ActionMenu';
import { EmptyState } from '@/components/EmptyState';
import { InboxRow } from '@/components/InboxRow';
import { RowsSkeleton } from '@/components/Loading';
import { LoadError } from '@/components/Notice';
import { Section } from '@/components/Section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { useAsync } from '@/hooks/useAsync';
import { useIsWide } from '@/hooks/useMediaQuery';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePersonActions } from '@/hooks/usePersonActions';
import { api, errorMessage } from '@/lib/api';
import { ChatPane } from '@/routes/Chat';

type Tab = 'requests' | 'connections' | 'messages';

function TabLabel({ label, count }: { label: string; count?: number }) {
  return (
    <>
      {label}
      {count ? (
        <Badge variant="secondary" className="h-5 min-w-5 justify-center bg-foreground/10 px-1.5 text-foreground tabular-nums group-data-active/tabs-trigger:bg-primary group-data-active/tabs-trigger:text-primary-foreground">
          {count}
        </Badge>
      ) : null}
    </>
  );
}

/** The three inbox sections as one list. Highlights `activeMatchId` in the two-pane layout. */
export function InboxList({ activeMatchId }: { activeMatchId: string | null }) {
  usePageTitle('Inbox');
  const { user } = useMember();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(activeMatchId ? 'messages' : 'requests');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, loading, error, reload } = useAsync(async () => {
    const [incoming, outgoing, connections] = await Promise.all([api.introductions.listIncoming(user.id), api.introductions.listOutgoing(user.id), api.connections.list(user.id)]);
    return { incoming, outgoing, connections };
  }, [user.id]);
  const person = usePersonActions({ onBlocked: reload });

  const matchKey = data?.connections.map((c) => c.matchId).join(',') ?? '';
  useEffect(() => {
    const offRequests = api.introductions.subscribeIncoming(user.id, reload);
    const offInbox = api.connections.subscribeInbox(matchKey ? matchKey.split(',') : [], reload);
    return () => {
      offRequests();
      offInbox();
    };
  }, [user.id, matchKey, reload]);

  const act = async (fn: () => Promise<unknown>, failure: string) => {
    try {
      await fn();
    } catch (e) {
      toast.add({ title: failure, description: errorMessage(e), type: 'error' });
    }
  };

  const accept = (r: IntroductionRequest) =>
    act(async () => {
      const matchId = await api.introductions.accept(r.id);
      navigate(`/chat/${matchId}`);
    }, 'Could not accept');

  const fresh = data?.connections.filter((c) => !c.lastMessage) ?? [];
  const threads = data?.connections.filter((c) => !!c.lastMessage) ?? [];
  const unreadTotal = threads.reduce((n, c) => n + c.unreadCount, 0);

  const connectionActions = (c: Connection): MenuAction[] => [
    { label: 'Open conversation', icon: LuMessageCircle, onSelect: () => navigate(`/chat/${c.matchId}`) },
    { label: 'View profile', icon: LuUser, onSelect: () => navigate(`/profile/${c.counterpart.id}`) },
    { label: `Report ${c.counterpart.firstName}`, icon: LuFlag, onSelect: () => person.reportMember(c.counterpart), destructive: true, separated: true },
    { label: `Block ${c.counterpart.firstName}`, icon: LuBan, onSelect: () => void person.blockMember(c.counterpart), destructive: true },
  ];

  const requestActions = (r: IntroductionRequest, incoming: boolean): MenuAction[] => [
    { label: 'View profile', icon: LuUser, onSelect: () => navigate(`/profile/${r.counterpart.id}`) },
    ...(incoming ? [] : [{ label: 'Withdraw request', icon: LuUndo2, onSelect: () => void act(async () => { await api.introductions.withdraw(r.id); reload(); }, 'Could not withdraw') }]),
    { label: `Report ${r.counterpart.firstName}`, icon: LuFlag, onSelect: () => person.reportMember(r.counterpart), destructive: true, separated: true },
    { label: `Block ${r.counterpart.firstName}`, icon: LuBan, onSelect: () => void person.blockMember(r.counterpart), destructive: true },
  ];

  return (
    <div>
      <PageHeader title="Inbox" />
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="requests" className="group/tabs-trigger">
            <TabLabel label="Requests" count={data?.incoming.length} />
          </TabsTrigger>
          <TabsTrigger value="connections" className="group/tabs-trigger">
            <TabLabel label="Connections" count={fresh.length} />
          </TabsTrigger>
          <TabsTrigger value="messages" className="group/tabs-trigger">
            <TabLabel label="Messages" count={unreadTotal} />
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <RowsSkeleton />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : tab === 'requests' ? (
        <div className="grid gap-8">
          {data && data.incoming.length === 0 ? (
            <EmptyState icon={LuInbox} title="No requests waiting." body="When someone asks to be introduced, their note appears here." className="py-12" />
          ) : (
            <div className="grid gap-1">
              {data?.incoming.map((r) => (
                <InboxRow
                  key={r.id}
                  testId="request-row"
                  name={r.counterpart.firstName}
                  photo={r.counterpart.photos[0] ?? null}
                  verified={r.counterpart.publicVerificationBadges.length > 0}
                  secondary={truncate(r.note, 80)}
                  time={timeAgo(r.createdAt)}
                  emphasize
                  active={expanded === r.id}
                  onClick={() => setExpanded((cur) => (cur === r.id ? null : r.id))}
                  actions={requestActions(r, true)}
                >
                  {expanded === r.id ? (
                    <div className="grid gap-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.note}</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void accept(r)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void act(async () => { await api.introductions.decline(r.id); reload(); }, 'Could not decline')}>
                          Decline
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/profile/${r.counterpart.id}`)}>
                          View profile
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </InboxRow>
              ))}
            </div>
          )}
          {data && data.outgoing.length > 0 ? (
            <Section title="Sent by you">
              <div className="grid gap-1">
                {data.outgoing.map((r) => (
                  <InboxRow
                    key={r.id}
                    name={r.counterpart.firstName}
                    photo={r.counterpart.photos[0] ?? null}
                    verified={r.counterpart.publicVerificationBadges.length > 0}
                    secondary="Waiting for a reply"
                    time={timeAgo(r.createdAt)}
                    active={expanded === r.id}
                    onClick={() => setExpanded((cur) => (cur === r.id ? null : r.id))}
                    actions={requestActions(r, false)}
                  >
                    {expanded === r.id ? (
                      <div className="grid gap-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{r.note}</p>
                        <div>
                          <Button size="sm" variant="outline" onClick={() => void act(async () => { await api.introductions.withdraw(r.id); reload(); }, 'Could not withdraw')}>
                            Withdraw
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </InboxRow>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      ) : tab === 'connections' ? (
        fresh.length === 0 ? (
          <EmptyState icon={LuUsers} title="No new connections." body="Accepted introductions that haven't started talking yet appear here." className="py-12" />
        ) : (
          <div className="grid gap-1">
            {fresh.map((c) => (
              <InboxRow
                key={c.matchId}
                testId="connection-row"
                name={c.counterpart.firstName}
                photo={c.counterpart.photos[0] ?? null}
                verified={c.counterpart.publicVerificationBadges.length > 0}
                secondary="Say hello"
                time={timeAgo(c.createdAt)}
                active={c.matchId === activeMatchId}
                to={`/chat/${c.matchId}`}
                actions={connectionActions(c)}
              />
            ))}
          </div>
        )
      ) : threads.length === 0 ? (
        <EmptyState icon={LuMessagesSquare} title="No conversations yet." body="Once a connection starts talking, the thread lives here." className="py-12" />
      ) : (
        <div className="grid gap-1">
          {threads.map((c) => (
            <InboxRow
              key={c.matchId}
              testId="thread-row"
              name={c.counterpart.firstName}
              photo={c.counterpart.photos[0] ?? null}
              verified={c.counterpart.publicVerificationBadges.length > 0}
              secondary={`${c.lastMessage?.senderId === user.id ? 'You: ' : ''}${truncate(c.lastMessage?.body ?? '', 70)}`}
              time={c.lastMessage ? timeAgo(c.lastMessage.createdAt) : undefined}
              unread={c.unreadCount}
              active={c.matchId === activeMatchId}
              to={`/chat/${c.matchId}`}
              actions={connectionActions(c)}
            />
          ))}
        </div>
      )}
      {person.dialogs}
    </div>
  );
}

function ChoosePlaceholder() {
  return (
    <div className="flex h-full items-center justify-center" data-testid="inbox-placeholder">
      <EmptyState icon={LuMessagesSquare} title="Choose a conversation." body="Requests, new connections, and messages are on the left." />
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
      <div className="grid h-full min-h-0 grid-cols-[360px_1fr]" data-testid="inbox-split">
        <aside className="h-full min-h-0 overflow-y-auto border-r pt-10 pr-6 pb-8">
          <InboxList activeMatchId={matchId ?? null} />
        </aside>
        <section className="h-full min-h-0 min-w-0 pl-6">{matchId ? <ChatPane key={matchId} matchId={matchId} /> : <ChoosePlaceholder />}</section>
      </div>
    );
  }
  if (matchId) return <ChatPane key={matchId} matchId={matchId} showBack />;
  return (
    <div className="h-full min-h-0 overflow-y-auto pt-6 pb-6 md:pt-10">
      <InboxList activeMatchId={null} />
    </div>
  );
}
