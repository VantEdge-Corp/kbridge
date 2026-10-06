import type { ReactNode } from 'react';
import { BRAND, type LegalPageKey } from '@peaches/core';
import { LegalLinks } from '@/components/LegalLinks';
import { ModeToggle } from '@/components/ModeToggle';
import { Wordmark } from '@/components/Wordmark';

/** Sticky header for the public pages: the wordmark, page links, and the appearance toggle. */
export function PublicHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center justify-between gap-4 px-4 md:px-8">
        <Wordmark to="/" />
        <nav aria-label="Site" className="flex items-center gap-1.5 sm:gap-2">
          {children}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter({ current }: { current?: LegalPageKey }) {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-8">
        <span>
          &copy; {new Date().getFullYear()} {BRAND.company} · {BRAND.name}, {BRAND.market}
        </span>
        <LegalLinks current={current} />
      </div>
    </footer>
  );
}
