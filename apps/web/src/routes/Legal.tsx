import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BRAND, LEGAL_PAGES, type LegalPageKey } from '@peaches/core';
import { LegalLinks } from '../components/LegalLinks';
import { Wordmark } from '../components/Wordmark';
import { usePageTitle } from '../hooks/usePageTitle';

const LINKABLE = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(\b(?:[a-z0-9-]+\.)+(?:org|gov)\b)|(\b1-800-\d{3}-\d{4}\b)/gi;
const LINK_CLASS = 'text-text underline underline-offset-4 decoration-1 break-words';

/** Document text with its email addresses, web addresses, and phone numbers made tappable. */
function Linkified({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINKABLE)) {
    const [match, email, site] = m;
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    if (email) {
      parts.push(<a key={at} href={`mailto:${email}`} className={LINK_CLASS}>{match}</a>);
    } else if (site) {
      parts.push(<a key={at} href={`https://${site}`} target="_blank" rel="noreferrer" className={LINK_CLASS}>{match}</a>);
    } else {
      parts.push(<a key={at} href={`tel:+${match.replace(/\D/g, '')}`} className={LINK_CLASS}>{match}</a>);
    }
    last = at + match.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/** Privacy Policy, Terms, Child Safety Standards, account deletion, and support. Public: no sign-in. */
export function Legal({ doc }: { doc: LegalPageKey }) {
  const document = LEGAL_PAGES[doc];
  usePageTitle(document.title);
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 h-16 px-5 md:px-10 flex items-center justify-between bg-canvas/80 backdrop-blur-md border-b border-border/60">
        <Wordmark to="/" />
        <Link to="/" className="text-body-sm text-text-muted hover:text-text motion">
          Back to start
        </Link>
      </header>
      <main className="flex-1 w-full max-w-[720px] mx-auto px-5 pb-20">
        <h1 className="font-display text-title leading-[34px] text-text text-balance mt-10 md:mt-16">{document.title}</h1>
        <p className="mt-2 text-caption text-text-muted">
          Effective {document.effectiveDate}
          {document.version ? ` · Version ${document.version}` : ''}
        </p>
        <p className="mt-6 text-body text-text-secondary leading-relaxed text-pretty">
          <Linkified text={document.intro} />
        </p>
        <div className="mt-10 space-y-10">
          {document.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-subheading text-text">{s.h}</h2>
              {s.p.map((paragraph, i) => (
                <p key={i} className="mt-3 text-body text-text-secondary leading-relaxed text-pretty">
                  <Linkified text={paragraph} />
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <footer className="py-6 px-5 md:px-10 flex flex-wrap items-center justify-between gap-4 text-caption text-text-muted border-t border-border">
        <span>
          &copy; {new Date().getFullYear()} {BRAND.company}
        </span>
        <LegalLinks current={doc} />
      </footer>
    </div>
  );
}
