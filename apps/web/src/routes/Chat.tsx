import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { messageTime, type Message } from '@peaches/core';
import { api, errorMessage } from '../lib/api';
import { useMember } from '../auth/AuthProvider';
import { Button, IconButton } from '../components/Button';
import { Menu } from '../components/Dialog';
import { Notice, inputClass } from '../components/Field';
import { Icon } from '../components/icons';
import { LoadingBlock } from '../components/Loading';
import { Avatar } from '../components/MonogramPortrait';
import { ReportDialog } from '../components/ReportDialog';
import { VerificationBadge } from '../components/VerificationBadge';
import { useAsync } from '../hooks/useAsync';
import { usePageTitle } from '../hooks/usePageTitle';

/**
 * One conversation. Fills its container's height: header, scrolling
 * messages, composer. `showBack` adds the back arrow used on narrow screens,
 * where the pane is the whole page.
 */
export function ChatPane({ matchId, showBack = false }: { matchId: string; showBack?: boolean }) {
  const { user } = useMember();
  const navigate = useNavigate();
  const { data, loading, error, setData } = useAsync(() => api.connections.get(matchId, user.id), [matchId, user.id]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const counterpart = data?.connection.counterpart;
  usePageTitle(counterpart ? counterpart.firstName : 'Conversation');

  useEffect(() => {
    if (!data) return;
    void api.connections.markRead(matchId, user.id);
    const off = api.connections.subscribeConversation(matchId, (message: Message) => {
      setData((d) => (d && !d.messages.some((m) => m.id === message.id) ? { ...d, messages: [...d.messages, message] } : d));
      if (message.senderId !== user.id) void api.connections.markRead(matchId, user.id);
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, user.id, !!data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [data?.messages.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
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

  const block = async () => {
    if (!counterpart || !window.confirm(`Block ${counterpart.firstName}? They won't be able to contact you.`)) return;
    try {
      await api.safety.block(user.id, counterpart.id);
      navigate('/inbox', { replace: true });
    } catch (err) {
      setSendError(errorMessage(err));
    }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <Notice tone="danger">{error}</Notice>;
  if (!data || !counterpart) {
    return (
      <div className="py-10">
        <Notice>This conversation could not be opened.</Notice>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0" data-testid="chat">
      <header className="flex items-center gap-3 h-16 border-b border-border shrink-0">
        {showBack ? (
          <Link to="/inbox" aria-label="Back to inbox" className="-ml-2 w-10 h-10 inline-flex items-center justify-center rounded-md text-text-secondary motion hover:text-text hover:bg-surface-hover focus-ring">
            <Icon name="arrowLeft" />
          </Link>
        ) : null}
        <Link to={`/profile/${counterpart.id}`} className="flex items-center gap-3 min-w-0 rounded-md focus-ring">
          <Avatar name={counterpart.firstName} src={counterpart.photos[0] ?? null} size={36} />
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="text-body text-text font-medium truncate">{counterpart.firstName}</span>
            {counterpart.publicVerificationBadges.length > 0 ? <VerificationBadge /> : null}
          </span>
          <span className="hidden sm:inline text-caption text-text-muted">{counterpart.displayArea}</span>
        </Link>
        <div className="relative ml-auto">
          <IconButton aria-label="More" onClick={() => setMenu((m) => !m)}>
            <Icon name="more" />
          </IconButton>
          <Menu
            open={menu}
            onClose={() => setMenu(false)}
            items={[
              { label: 'View profile', onClick: () => navigate(`/profile/${counterpart.id}`) },
              { label: 'Report', onClick: () => setReport(true) },
              { label: 'Block', onClick: () => void block(), danger: true },
            ]}
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto py-5 space-y-2">
        {data.connection.introductionNote ? (
          <div className="mb-5 bg-surface border border-border rounded-lg px-4 py-3.5">
            <p className="text-micro uppercase tracking-[1.2px] text-text-muted mb-1.5">{data.connection.introducedBy === 'viewer' ? 'Your introduction' : `${counterpart.firstName}'s introduction`}</p>
            <p className="text-body-sm text-text-secondary whitespace-pre-wrap">{data.connection.introductionNote}</p>
          </div>
        ) : null}
        {data.messages.length === 0 ? <p className="text-center text-body-sm text-text-muted py-8">Begin anywhere.</p> : null}
        {data.messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-4 py-2.5 ${mine ? 'bg-surface-elevated rounded-lg rounded-br-sm' : 'bg-surface border border-border rounded-lg rounded-bl-sm'}`}>
                <p className="text-body text-text whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-micro text-text-muted ${mine ? 'text-right' : ''}`}>{messageTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={(e) => void send(e)} className="shrink-0 border-t border-border py-3 space-y-2" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {sendError ? <Notice tone="danger">{sendError}</Notice> : null}
        <div className="flex items-end gap-2">
          <textarea
            aria-label="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(e);
              }
            }}
            rows={1}
            placeholder={`Message ${counterpart.firstName}`}
            className={`${inputClass} py-2.5 min-h-11 max-h-40 resize-none`}
          />
          <Button type="submit" aria-label="Send" disabled={sending || !draft.trim()} className="w-11 px-0 shrink-0">
            <Icon name="send" size={18} />
          </Button>
        </div>
      </form>
      <ReportDialog open={report} onClose={() => setReport(false)} reportedId={counterpart.id} reportedName={counterpart.firstName} matchId={matchId} />
    </div>
  );
}
