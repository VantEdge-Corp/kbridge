import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PublicFooter, PublicHeader } from '@/components/PublicChrome';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Centered frame for the admission flow and sign-in: a small-caps kicker, the
 * title in the display serif, a lede, then the form. 560px wide, 720 when `wide`.
 */
export function PublicFrame({ children, title, lede, kicker = 'Members only', wide = false }: { children: ReactNode; title: string; lede?: ReactNode; kicker?: string; wide?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader>
        <Link to="/" className={buttonVariants({ variant: 'ghost' })}>
          Back to start
        </Link>
      </PublicHeader>
      <main className={cn('mx-auto w-full flex-1 px-4 pt-10 pb-20 md:pt-16', wide ? 'max-w-[720px]' : 'max-w-[560px]')}>
        <p className="kicker text-muted-foreground">{kicker}</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] font-medium text-balance md:text-[3.5rem]">{title}</h1>
        {lede ? <p className="mt-3 text-muted-foreground text-pretty">{lede}</p> : null}
        <div className="mt-10">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
