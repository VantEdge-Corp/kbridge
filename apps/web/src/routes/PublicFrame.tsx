import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PublicFooter, PublicHeader } from '@/components/PublicChrome';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Centered frame for the admission flow and sign-in: 560px wide, 720 when `wide`. */
export function PublicFrame({ children, title, lede, wide = false }: { children: ReactNode; title: string; lede?: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader>
        <Link to="/" className={buttonVariants({ variant: 'ghost' })}>
          Back to start
        </Link>
      </PublicHeader>
      <main className={cn('mx-auto w-full flex-1 px-4 pt-10 pb-20 md:pt-16', wide ? 'max-w-[720px]' : 'max-w-[560px]')}>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {lede ? <p className="mt-2 text-muted-foreground text-pretty">{lede}</p> : null}
        <div className="mt-8">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
