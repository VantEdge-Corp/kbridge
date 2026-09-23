import { Link } from 'react-router-dom';
import type { LegalPageKey } from '@peaches/core';

const LINKS: ReadonlyArray<{ key: LegalPageKey; label: string }> = [
  { key: 'privacy', label: 'Privacy' },
  { key: 'terms', label: 'Terms' },
  { key: 'child-safety', label: 'Child safety' },
  { key: 'delete-account', label: 'Delete account' },
  { key: 'support', label: 'Support' },
];

/** The public policy and help pages, for page footers. The app stores link to several of them. Phones get a tidy 3-column grid. */
export function LegalLinks({ current }: { current?: LegalPageKey }) {
  return (
    <nav aria-label="Policies and help" className="grid grid-cols-3 gap-x-5 gap-y-2 sm:flex sm:flex-wrap">
      {LINKS.map((link) =>
        link.key === current ? (
          <span key={link.key} aria-current="page" className="text-text">
            {link.label}
          </span>
        ) : (
          <Link key={link.key} to={`/${link.key}`} className="hover:text-text motion">
            {link.label}
          </Link>
        ),
      )}
    </nav>
  );
}
