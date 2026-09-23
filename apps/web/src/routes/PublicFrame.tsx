import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LegalLinks } from '../components/LegalLinks';
import { Wordmark } from '../components/Wordmark';

/** Centered frame for the admission flow and sign-in pages: 560px wide, 720 when `wide`. */
export function PublicFrame({ children, title, lede, wide = false }: { children: ReactNode; title: string; lede?: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 h-16 px-5 md:px-10 flex items-center justify-between bg-canvas/80 backdrop-blur-md border-b border-border/60">
        <Wordmark to="/" />
        <Link to="/" className="text-body-sm text-text-muted hover:text-text motion">
          Back to start
        </Link>
      </header>
      <main className={`flex-1 w-full mx-auto px-5 pb-20 ${wide ? 'max-w-[720px]' : 'max-w-[560px]'}`}>
        <h1 className="font-display text-title leading-[34px] text-text mt-10 md:mt-16">{title}</h1>
        {lede ? <p className="mt-2 text-body text-text-secondary leading-relaxed">{lede}</p> : null}
        <div className="mt-8">{children}</div>
      </main>
      <footer className="py-6 px-5 md:px-10 text-caption text-text-muted border-t border-border">
        <LegalLinks />
      </footer>
    </div>
  );
}
