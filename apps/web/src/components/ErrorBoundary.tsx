import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

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
      <main className="min-h-screen bg-canvas text-text flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-border rounded-lg bg-surface p-6">
          <p className="font-display text-heading mb-2">Something went wrong.</p>
          <p className="text-text-secondary text-body-sm whitespace-pre-wrap">{this.state.error.message}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className="h-11 px-4 rounded-md bg-ivory text-on-ivory text-body font-medium"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
            <a href="/" className="h-11 px-4 rounded-md border border-border text-text inline-flex items-center">
              Return home
            </a>
          </div>
        </div>
      </main>
    );
  }
}
