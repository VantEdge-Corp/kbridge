import type { ReactNode } from 'react';

export function SectionHeader({ title, action, className = '' }: { title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-3 mb-3 ${className}`}>
      <h2 className="text-micro uppercase tracking-[1.2px] text-text-muted">{title}</h2>
      {action ? <div className="text-body-sm">{action}</div> : null}
    </div>
  );
}
