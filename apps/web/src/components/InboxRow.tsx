import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ActionContextMenu, type MenuAction } from '@/components/ActionMenu';
import { PersonAvatar } from '@/components/PersonAvatar';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Badge } from '@/components/ui/badge';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { cn } from '@/lib/utils';

/**
 * One person in an inbox list: a 40px avatar, the name, one line of preview,
 * the time, and an unread count. The whole row opens `to` (or runs `onClick`);
 * right-click or long-press shows `actions`.
 */
export function InboxRow({
  name,
  photo,
  verified,
  secondary,
  time,
  unread = 0,
  active = false,
  emphasize = false,
  to,
  onClick,
  actions = [],
  children,
  testId,
}: {
  name: string;
  photo?: string | null;
  verified?: boolean;
  secondary: ReactNode;
  time?: string;
  unread?: number;
  active?: boolean;
  /** Draw the name and preview at full strength: it's the member's turn. */
  emphasize?: boolean;
  to?: string;
  onClick?: () => void;
  actions?: MenuAction[];
  children?: ReactNode;
  testId?: string;
}) {
  const body = (
    <>
      <ItemMedia>
        <PersonAvatar name={name} src={photo} className="size-10" />
      </ItemMedia>
      <ItemContent className="min-w-0 gap-0.5">
        <ItemTitle className="w-full">
          <span className={cn('truncate', emphasize || unread ? 'font-semibold' : 'font-medium')}>{name}</span>
          {verified ? <VerificationBadge /> : null}
        </ItemTitle>
        <ItemDescription className={cn('line-clamp-1', (emphasize || unread) && 'text-foreground')}>{secondary}</ItemDescription>
      </ItemContent>
      <ItemActions className="flex-col items-end gap-1 self-start pt-0.5">
        {time ? <span className="text-xs text-muted-foreground tabular-nums">{time}</span> : null}
        {unread ? (
          <Badge className="h-5 min-w-5 justify-center px-1.5 tabular-nums" aria-label={`${unread} unread`}>
            {unread}
          </Badge>
        ) : null}
      </ItemActions>
    </>
  );
  const itemClass = cn('rounded-lg px-3 py-3 hover:bg-muted', active && 'bg-muted');
  return (
    <ActionContextMenu actions={actions} className="w-full" >
      <div data-testid={testId}>
        {to ? (
          <Item render={<Link to={to} aria-current={active ? 'page' : undefined} />} className={itemClass}>
            {body}
          </Item>
        ) : (
          <Item render={<button type="button" onClick={onClick} />} className={cn(itemClass, 'cursor-pointer text-left')}>
            {body}
          </Item>
        )}
        {children ? <div className="pt-1 pr-3 pb-3 pl-[4.25rem]">{children}</div> : null}
      </div>
    </ActionContextMenu>
  );
}
