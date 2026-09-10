import { PREFERENCE_STRENGTHS, type PreferenceStrength } from '@peaches/core';

const LABEL: Record<PreferenceStrength, string> = { required: 'Required', preferred: 'Preferred', any: 'Any' };

/** Compact segmented control: Required · Preferred · Any. One per preference row. */
export function PreferenceStrengthSelector({ value, onChange, label }: { value: PreferenceStrength; onChange: (s: PreferenceStrength) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={`${label} strength`} className="inline-flex h-7 rounded-md border border-border overflow-hidden shrink-0">
      {PREFERENCE_STRENGTHS.map((s) => {
        const selected = s === value;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(s)}
            className={`px-2.5 text-micro tracking-wide transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border-strong ${
              selected ? 'bg-ivory text-on-ivory' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
