import type { CSSProperties, ReactNode } from 'react';
import { Eyebrow } from './Field';

/**
 * Grouped container: surface background, 1px border, radius lg. Rows live
 * inside one of these and separate themselves with inset hairlines.
 */
export function Group({ children, className = '', testId }: { children: ReactNode; className?: string; testId?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-lg overflow-hidden ${className}`} data-testid={testId}>
      {children}
    </div>
  );
}

/** A padded section inside a Group, with an optional eyebrow title inside. */
export function GroupSection({ eyebrow, action, children, className = '' }: { eyebrow?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`p-5 md:p-6 border-b border-border last:border-b-0 ${className}`}>
      {eyebrow || action ? (
        <div className="flex items-center justify-between gap-3 mb-4">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : <span />}
          {action ? <div className="text-body-sm">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Classes for a row with an inset hairline below it (hidden on the last row). Pair with `rowInset(px)` for the style. */
export const ROW_HAIRLINE =
  "relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:left-[var(--row-inset)] after:h-px after:bg-border last:after:hidden";

export function rowInset(px: number): CSSProperties {
  return { ['--row-inset' as string]: `${px}px` };
}

/** A generic row inside a Group with an inset hairline. `inset` is where the line starts, in px from the left. */
export function GroupRow({ children, inset = 16, className = '' }: { children: ReactNode; inset?: number; className?: string }) {
  return (
    <div className={`${ROW_HAIRLINE} ${className}`} style={rowInset(inset)}>
      {children}
    </div>
  );
}
