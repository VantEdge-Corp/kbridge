import type { ReactNode } from 'react';

/** Centered, calm: one sentence, optional detail, optional single secondary action. */
export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-body text-text-secondary">{title}</p>
      {body ? <p className="mt-1.5 text-body-sm text-text-muted max-w-sm mx-auto">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
