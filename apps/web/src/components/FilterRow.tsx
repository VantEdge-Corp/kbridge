import type { ReactNode } from 'react';
import type { PreferenceStrength } from '@peaches/core';
import { PreferenceStrengthSelector } from './PreferenceStrengthSelector';

/** One preference dimension: label, its own strength control, and the value control underneath. */
export function FilterRow({
  label,
  hint,
  strength,
  onStrength,
  children,
}: {
  label: string;
  hint?: ReactNode;
  strength?: PreferenceStrength;
  onStrength?: (s: PreferenceStrength) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5 min-h-7">
        <div className="min-w-0">
          <span className="text-body-sm text-text-secondary">{label}</span>
          {hint ? <span className="ml-2 text-caption text-text-muted">{hint}</span> : null}
        </div>
        {strength && onStrength ? <PreferenceStrengthSelector value={strength} onChange={onStrength} label={label} /> : null}
      </div>
      <div className={strength === 'any' ? 'opacity-70' : ''}>{children}</div>
    </div>
  );
}
