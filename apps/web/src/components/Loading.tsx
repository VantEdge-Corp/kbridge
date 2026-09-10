import { Wordmark } from './Wordmark';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-5 w-5 rounded-full border border-border-strong border-t-ivory animate-spin ${className}`}
    />
  );
}

export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-text-muted text-body-sm">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function FullScreenLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <Wordmark />
      <Spinner />
    </main>
  );
}
