import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Wordmark } from '@/components/Wordmark';
import { cn } from '@/lib/utils';

export function LoadingBlock({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground', className)}>
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function FullScreenLoading() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6">
      <Wordmark />
      <Spinner className="text-muted-foreground" />
    </main>
  );
}

/** Placeholder for a grid of person cards while discovery loads. */
export function PersonGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading people" className="@container">
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 @xl:grid-cols-3 @xl:gap-x-4 @4xl:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder rows for lists (inbox, settings, comments). */
export function RowsSkeleton({ rows = 4, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="divide-y rounded-xl border">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          {avatar ? <Skeleton className="size-10 shrink-0 rounded-full" /> : null}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
