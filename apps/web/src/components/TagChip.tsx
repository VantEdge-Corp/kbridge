import type { ReactNode } from 'react';

export function TagChip({ children, selected = false, onClick, className = '' }: { children: ReactNode; selected?: boolean; onClick?: () => void; className?: string }) {
  const base = `inline-flex items-center h-8 px-3 rounded-full border text-body-sm whitespace-nowrap motion ${
    selected ? 'bg-ivory text-on-ivory border-ivory' : 'bg-transparent text-text-secondary border-border'
  } ${className}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={selected} className={`${base} hover:border-border-strong focus-ring`}>
        {children}
      </button>
    );
  }
  return <span className={base}>{children}</span>;
}
