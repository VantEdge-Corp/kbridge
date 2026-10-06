import { Fragment, type ComponentType, type ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { LuEllipsis } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** One entry in an item's menu. The same list feeds its ⋯ button and its right-click / long-press menu. */
export interface MenuAction {
  label: string;
  icon?: IconType;
  onSelect: () => void;
  destructive?: boolean;
  /** Draws a separator above this entry. */
  separated?: boolean;
}

interface ItemProps {
  variant?: 'default' | 'destructive';
  onClick?: () => void;
  children?: ReactNode;
}

function MenuItems({ actions, Item, Separator }: { actions: ReadonlyArray<MenuAction>; Item: ComponentType<ItemProps>; Separator: ComponentType }) {
  return (
    <>
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <Fragment key={action.label}>
            {action.separated && i > 0 ? <Separator /> : null}
            <Item variant={action.destructive ? 'destructive' : 'default'} onClick={action.onSelect}>
              {Icon ? <Icon /> : null}
              {action.label}
            </Item>
          </Fragment>
        );
      })}
    </>
  );
}

/** The visible ⋯ button and its menu. */
export function MoreMenu({ actions, label = 'More', className, align = 'end' }: { actions: ReadonlyArray<MenuAction>; label?: string; className?: string; align?: 'start' | 'center' | 'end' }) {
  if (actions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={label} className={className} />}>
        <LuEllipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-auto min-w-48">
        <MenuItems actions={actions} Item={DropdownMenuItem} Separator={DropdownMenuSeparator} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Right-click (long-press on touch) anywhere on `children` for the same
 * actions as the item's ⋯ button. Always an enhancement: every action here
 * also has a visible control.
 */
export function ActionContextMenu({ actions, children, className }: { actions: ReadonlyArray<MenuAction>; children: ReactNode; className?: string }) {
  if (actions.length === 0) return <div className={className}>{children}</div>;
  return (
    <ContextMenu>
      <ContextMenuTrigger className={cn('select-auto', className)}>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-48">
        <MenuItems actions={actions} Item={ContextMenuItem} Separator={ContextMenuSeparator} />
      </ContextMenuContent>
    </ContextMenu>
  );
}
