import { Link } from 'react-router-dom';
import { BRAND } from '@peaches/core';

/** PEACHES in Georgia, letter-spaced. The only place the brand name is set in display type. */
export function Wordmark({ to, size = 20, className = '' }: { to?: string; size?: number; className?: string }) {
  const text = (
    <span className={`font-display text-ivory tracking-[4px] select-none ${className}`} style={{ fontSize: size }}>
      {BRAND.wordmark}
    </span>
  );
  return to ? (
    <Link to={to} aria-label={`${BRAND.name} home`} className="inline-flex">
      {text}
    </Link>
  ) : (
    text
  );
}
