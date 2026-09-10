import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';

/** Narrow centered frame for the admission flow and sign-in pages. */
export function PublicFrame({ children, title, lede, wide = false }: { children: ReactNode; title: string; lede?: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="h-16 px-5 md:px-10 flex items-center justify-between">
        <Wordmark to="/" />
        <Link to="/" className="text-body-sm text-text-muted hover:text-text">
          Back to start
        </Link>
      </header>
      <main className={`flex-1 w-full mx-auto px-5 pb-16 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <h1 className="font-display text-title leading-tight text-text mt-8 md:mt-14">{title}</h1>
        {lede ? <p className="mt-3 text-body text-text-secondary leading-relaxed">{lede}</p> : null}
        <div className="mt-8">{children}</div>
      </main>
      <footer className="h-14 px-5 md:px-10 flex items-center gap-5 text-caption text-text-muted border-t border-border">
        <Link to="/privacy" className="hover:text-text">
          Privacy
        </Link>
        <Link to="/terms" className="hover:text-text">
          Terms
        </Link>
      </footer>
    </div>
  );
}
