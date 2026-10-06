import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A titled block of a page: heading, optional description and action, then content. */
export function Section({ title, description, action, children, className, id }: { title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section className={cn('grid gap-3', className)} aria-labelledby={id}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
