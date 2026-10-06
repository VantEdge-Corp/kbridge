import { Link } from 'react-router-dom';
import { BRAND } from '@peaches/core';
import { cn } from '@/lib/utils';

/** PEACHES in Georgia, letter-spaced: the brand mark. Georgia appears nowhere else in the interface. */
export function Wordmark({ to, className }: { to?: string; className?: string }) {
  const mark = <span className={cn('font-display text-xl font-normal tracking-[0.2em] text-foreground select-none', className)}>{BRAND.wordmark}</span>;
  if (!to) return mark;
  return (
    <Link to={to} aria-label={`${BRAND.name} home`} className="inline-flex rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {mark}
    </Link>
  );
}

/** The single-letter mark used where the wordmark does not fit: the collapsed sidebar, matching the favicon. */
export function Monogram({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('font-display text-lg leading-none font-normal text-foreground select-none', className)}>
      P
    </span>
  );
}
