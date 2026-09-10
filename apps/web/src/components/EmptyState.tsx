import type { ReactNode } from 'react';

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border border-border rounded-lg bg-surface px-5 py-10 text-center">
      <p className="font-display text-subheading text-text">{title}</p>
      {body ? <p className="mt-2 text-body-sm text-text-muted max-w-sm mx-auto">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
