import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_PAGES, type LegalPageKey } from '@peaches/core';
import { PublicFooter, PublicHeader } from '@/components/PublicChrome';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePageTitle } from '@/hooks/usePageTitle';

const LINKABLE = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(\b(?:[a-z0-9-]+\.)+(?:org|gov)\b)|(\b1-800-\d{3}-\d{4}\b)/gi;
const LINK_CLASS = 'font-medium text-foreground underline underline-offset-4 break-words';

/** Document text with its email addresses, web addresses, and phone numbers made tappable. */
function Linkified({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINKABLE)) {
    const [match, email, site] = m;
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    if (email) {
      parts.push(
        <a key={at} href={`mailto:${email}`} className={LINK_CLASS}>
          {match}
        </a>,
      );
    } else if (site) {
      parts.push(
        <a key={at} href={`https://${site}`} target="_blank" rel="noreferrer" className={LINK_CLASS}>
          {match}
        </a>,
      );
    } else {
      parts.push(
        <a key={at} href={`tel:+${match.replace(/\D/g, '')}`} className={LINK_CLASS}>
          {match}
        </a>,
      );
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
    <div className="flex min-h-dvh flex-col">
      <PublicHeader>
        <Link to="/" className={buttonVariants({ variant: 'ghost' })}>
          Back to start
        </Link>
      </PublicHeader>
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pt-10 pb-20 md:pt-16">
        <h1 className="font-display text-5xl leading-[1.05] font-medium text-balance md:text-[3.5rem]">{document.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Effective {document.effectiveDate}
          {document.version ? ` · Version ${document.version}` : ''}
        </p>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
          <Linkified text={document.intro} />
        </p>
        <Separator className="my-10" />
        <div className="grid gap-10">
          {document.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold tracking-tight">{s.h}</h2>
              {s.p.map((paragraph, i) => (
                <p key={i} className="mt-3 leading-7 text-muted-foreground text-pretty">
                  <Linkified text={paragraph} />
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <PublicFooter current={doc} />
    </div>
  );
}
