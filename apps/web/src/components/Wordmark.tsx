import { Link } from 'react-router-dom';
import { BRAND } from '@peaches/core';
import { cn } from '@/lib/utils';

/** PEACHES in Instrument Serif, letter-spaced: the brand mark. */
export function Wordmark({ to, className }: { to?: string; className?: string }) {
  const mark = <span className={cn('font-display text-[1.375rem] leading-none font-normal tracking-[0.22em] text-foreground select-none', className)}>{BRAND.wordmark}</span>;
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
    <span aria-hidden="true" className={cn('font-display text-[1.375rem] leading-none font-normal text-foreground select-none', className)}>
      P
    </span>
  );
}
