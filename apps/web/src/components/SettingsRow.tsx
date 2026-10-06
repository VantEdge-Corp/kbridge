import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { LuChevronRight } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { cn } from '@/lib/utils';

/** A row in a settings list: icon, label, optional description, trailing chevron. */
export function SettingsRow({
  to,
  onClick,
  icon: Icon,
  label,
  description,
  destructive = false,
  trailing,
}: {
  to?: string;
  onClick?: () => void;
  icon: IconType;
  label: string;
  description?: ReactNode;
  destructive?: boolean;
  trailing?: ReactNode;
}) {
  const body = (
    <>
      <ItemMedia variant="icon" className={cn('text-muted-foreground', destructive && 'text-destructive')}>
        <Icon />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className={cn(destructive && 'text-destructive')}>{label}</ItemTitle>
        {description ? <ItemDescription className="line-clamp-1">{description}</ItemDescription> : null}
      </ItemContent>
      <ItemActions>{trailing ?? <LuChevronRight className="size-4 text-muted-foreground" />}</ItemActions>
    </>
  );
  const className = 'rounded-none px-4 py-3 hover:bg-muted';
  return to ? (
    <Item render={<Link to={to} />} className={className}>
      {body}
    </Item>
  ) : (
    <Item render={<button type="button" onClick={onClick} />} className={cn(className, 'cursor-pointer text-left')}>
      {body}
    </Item>
  );
}

/** A bordered list of rows separated by hairlines. */
export function RowGroup({ children, className }: { children: ReactNode; className?: string }) {
  // Rows are shadcn Items, which carry a transparent 1px border; color its bottom edge to draw the hairline.
  return <div className={cn('overflow-hidden rounded-xl border bg-card shadow-xs *:not-last:border-b *:not-last:border-b-border', className)}>{children}</div>;
}
