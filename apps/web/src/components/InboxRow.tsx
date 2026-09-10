import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROW_HAIRLINE, rowInset } from './Group';
import { Avatar } from './MonogramPortrait';
import { VerificationBadge } from './VerificationBadge';

/** Compact inbox row inside a Group: 40px avatar, name, one secondary line, time, optional unread pill. */
export function InboxRow({
  profileId,
  name,
  photo,
  verified,
  secondary,
  time,
  unread = 0,
  active = false,
  onClick,
  to,
  children,
  testId,
}: {
  profileId: string;
  name: string;
  photo?: string | null;
  verified?: boolean;
  secondary: ReactNode;
  time?: string;
  unread?: number;
  active?: boolean;
  onClick?: () => void;
  to?: string;
  children?: ReactNode;
  testId?: string;
}) {
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-body truncate ${unread ? 'text-text font-medium' : 'text-text'}`}>{name}</span>
          {verified ? <VerificationBadge /> : null}
        </div>
        <div className={`text-body-sm truncate ${unread ? 'text-text-secondary' : 'text-text-muted'}`}>{secondary}</div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {time ? <span className="text-caption text-text-muted">{time}</span> : null}
        {unread ? (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-ivory text-on-ivory text-micro font-medium inline-flex items-center justify-center" aria-label={`${unread} unread`}>
            {unread}
          </span>
        ) : null}
      </div>
    </>
  );
  const rowClass = 'flex items-center gap-3 flex-1 min-w-0 text-left min-h-16 py-2 pr-4 rounded-md focus-ring';
  return (
    <div className={`${ROW_HAIRLINE} motion ${active ? 'bg-surface-elevated' : 'hover:bg-surface-hover'}`} style={rowInset(68)} data-testid={testId}>
      <div className="flex items-center gap-3 pl-4">
        <Link to={`/profile/${profileId}`} aria-label={`${name}'s profile`} className="shrink-0 rounded-full focus-ring">
          <Avatar name={name} src={photo} size={40} />
        </Link>
        {to ? (
          <Link to={to} className={rowClass} aria-current={active ? 'page' : undefined}>
            {body}
          </Link>
        ) : (
          <button type="button" onClick={onClick} className={rowClass}>
            {body}
          </button>
        )}
      </div>
      {children ? <div className="pl-[68px] pr-4 pb-4">{children}</div> : null}
    </div>
  );
}
