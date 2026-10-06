import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils';

/** Centered and calm: an optional icon, one sentence, optional detail, at most one action. */
export function EmptyState({ icon: Icon, title, body, action, className }: { icon?: IconType; title: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <Empty className={cn('py-16', className)}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        {body ? <EmptyDescription>{body}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
