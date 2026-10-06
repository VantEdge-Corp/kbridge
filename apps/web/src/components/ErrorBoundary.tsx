import { Component, type ErrorInfo, type ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';

interface State {
  error: Error | null;
}

/** Last resort for a render crash. Plain elements only: nothing here may depend on providers that could be the cause. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xs">
          <p className="text-lg font-semibold tracking-tight">Something went wrong.</p>
          <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">{this.state.error.message}</p>
          <div className="mt-6 flex gap-2">
            <button type="button" className={buttonVariants()} onClick={() => window.location.reload()}>
              Try again
            </button>
            <a href="/" className={buttonVariants({ variant: 'outline' })}>
              Return home
            </a>
          </div>
        </div>
      </main>
    );
  }
}
