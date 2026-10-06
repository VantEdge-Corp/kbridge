import { useEffect, useState, type FormEvent } from 'react';
import { LuArrowLeft, LuArrowUp, LuBan, LuCopy, LuFlag, LuMessageSquareQuote, LuUser } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import { messageTime, type Message as ChatMessage } from '@peaches/core';
import { useMember } from '@/auth/AuthProvider';
import { ActionContextMenu, MoreMenu, type MenuAction } from '@/components/ActionMenu';
import { LoadingBlock } from '@/components/Loading';
import { LoadError, Notice } from '@/components/Notice';
import { PersonAvatar } from '@/components/PersonAvatar';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { buttonVariants } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group';
import { Message, MessageContent, MessageFooter } from '@/components/ui/message';
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from '@/components/ui/message-scroller';
import { toast } from '@/components/ui/toast';
import { useAsync } from '@/hooks/useAsync';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePersonActions } from '@/hooks/usePersonActions';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

function copyText(text: string) {
  void navigator.clipboard
    .writeText(text)
    .then(() => toast.add({ title: 'Message copied', type: 'success' }))
    .catch(() => toast.add({ title: 'Could not copy', type: 'error' }));
}

/**
 * One conversation. Fills its container's height: header, scrolling
 * messages, composer. `showBack` adds the back arrow used on narrow screens,
 * where the pane is the whole page.
 */
export function ChatPane({ matchId, showBack = false }: { matchId: string; showBack?: boolean }) {
  const { user } = useMember();
  const navigate = useNavigate();
  const { data, loading, error, reload, setData } = useAsync(() => api.connections.get(matchId, user.id), [matchId, user.id]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const person = usePersonActions({ onBlocked: () => navigate('/inbox', { replace: true }) });
  const counterpart = data?.connection.counterpart;
  usePageTitle(counterpart ? counterpart.firstName : 'Conversation');

  useEffect(() => {
    if (!data) return;
    void api.connections.markRead(matchId, user.id);
    const off = api.connections.subscribeConversation(matchId, (message: ChatMessage) => {
      setData((d) => (d && !d.messages.some((m) => m.id === message.id) ? { ...d, messages: [...d.messages, message] } : d));
      if (message.senderId !== user.id) void api.connections.markRead(matchId, user.id);
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, user.id, !!data]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const message = await api.connections.send(matchId, user.id, body);
      setData((d) => (d && !d.messages.some((m) => m.id === message.id) ? { ...d, messages: [...d.messages, message] } : d));
      setDraft('');
    } catch (err) {
      setSendError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!data || !counterpart) {
    return (
      <div className="py-10">
        <Notice>This conversation could not be opened.</Notice>
      </div>
    );
  }

  const headerActions: MenuAction[] = [
    { label: 'View profile', icon: LuUser, onSelect: () => navigate(`/profile/${counterpart.id}`) },
    { label: `Report ${counterpart.firstName}`, icon: LuFlag, onSelect: () => person.reportMember(counterpart), destructive: true, separated: true },
    { label: `Block ${counterpart.firstName}`, icon: LuBan, onSelect: () => void person.blockMember(counterpart), destructive: true },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="chat">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b">
        {showBack ? (
          <Link to="/inbox" aria-label="Back to inbox" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), '-ml-2')}>
            <LuArrowLeft />
          </Link>
        ) : null}
        <Link to={`/profile/${counterpart.id}`} className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <PersonAvatar name={counterpart.firstName} src={counterpart.photos[0] ?? null} className="size-9" />
          <span className="grid min-w-0 leading-tight">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-medium">{counterpart.firstName}</span>
              {counterpart.publicVerificationBadges.length > 0 ? <VerificationBadge /> : null}
            </span>
            <span className="truncate text-xs text-muted-foreground">{counterpart.displayArea}</span>
          </span>
        </Link>
        <MoreMenu actions={headerActions} label="Conversation options" className="ml-auto -mr-2" />
      </header>

      <MessageScrollerProvider defaultScrollPosition="end" autoScroll>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport aria-label={`Conversation with ${counterpart.firstName}`}>
            <MessageScrollerContent className="gap-3 py-6">
              {data.connection.introductionNote ? (
                <MessageScrollerItem>
                  <div className="mx-auto mb-3 w-full max-w-md rounded-xl border bg-muted/40 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <LuMessageSquareQuote className="size-3.5" />
                      {data.connection.introducedBy === 'viewer' ? 'Your introduction' : `${counterpart.firstName}'s introduction`}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">{data.connection.introductionNote}</p>
                  </div>
                </MessageScrollerItem>
              ) : null}
              {data.messages.length === 0 ? (
                <MessageScrollerItem>
                  <p className="py-6 text-center text-sm text-muted-foreground">Begin anywhere.</p>
                </MessageScrollerItem>
              ) : null}
              {data.messages.map((m) => {
                const mine = m.senderId === user.id;
                return (
                  <MessageScrollerItem key={m.id} messageId={m.id} scrollAnchor={mine}>
                    <Message align={mine ? 'end' : 'start'}>
                      <MessageContent className="gap-1">
                        <ActionContextMenu actions={[{ label: 'Copy message', icon: LuCopy, onSelect: () => copyText(m.body) }]} className="flex w-full flex-col">
                          <Bubble variant={mine ? 'default' : 'muted'} align={mine ? 'end' : 'start'}>
                            <BubbleContent className="whitespace-pre-wrap">{m.body}</BubbleContent>
                          </Bubble>
                        </ActionContextMenu>
                        <MessageFooter className="px-1 font-normal tabular-nums">{messageTime(m.createdAt)}</MessageFooter>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                );
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton aria-label="Jump to latest" />
        </MessageScroller>
      </MessageScrollerProvider>

      <form onSubmit={(e) => void send(e)} className="grid shrink-0 gap-2 border-t pt-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {sendError ? <Notice tone="danger">{sendError}</Notice> : null}
        <InputGroup>
          <InputGroupTextarea
            aria-label="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={`Message ${counterpart.firstName}`}
            className="max-h-40 min-h-10 py-2.5"
          />
          <InputGroupAddon align="inline-end" className="self-end pb-1.5">
            <InputGroupButton type="submit" variant="default" size="icon-sm" aria-label="Send" disabled={sending || !draft.trim()} className="rounded-full">
              <LuArrowUp />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
      {person.dialogs}
    </div>
  );
}
