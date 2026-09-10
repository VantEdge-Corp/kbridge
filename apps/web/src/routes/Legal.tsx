import { Link } from 'react-router-dom';
import { DOCUMENTS } from '@peaches/core';
import { Wordmark } from '../components/Wordmark';
import { usePageTitle } from '../hooks/usePageTitle';

export function Legal({ doc }: { doc: 'privacy' | 'terms' }) {
  const document = DOCUMENTS[doc];
  usePageTitle(document.title);
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 h-16 px-5 md:px-10 flex items-center justify-between bg-canvas/80 backdrop-blur-md border-b border-border/60">
        <Wordmark to="/" />
        <nav className="flex gap-5 text-body-sm">
          <Link to="/privacy" className={doc === 'privacy' ? 'text-text' : 'text-text-muted hover:text-text'}>
            Privacy
          </Link>
          <Link to="/terms" className={doc === 'terms' ? 'text-text' : 'text-text-muted hover:text-text'}>
            Terms
          </Link>
        </nav>
      </header>
      <main className="flex-1 w-full max-w-[720px] mx-auto px-5 pb-20">
        <h1 className="font-display text-title leading-[34px] text-text mt-10 md:mt-16">{document.title}</h1>
        <p className="mt-2 text-caption text-text-muted">
          Effective {document.effectiveDate} · Version {document.version}
        </p>
        <p className="mt-6 text-body text-text-secondary leading-relaxed">{document.intro}</p>
        <div className="mt-10 space-y-10">
          {document.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-subheading text-text">{s.h}</h2>
              {s.p.map((paragraph, i) => (
                <p key={i} className="mt-3 text-body text-text-secondary leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
