import { PREFERENCE_STRENGTHS, type PreferenceStrength } from '@peaches/core';

const LABEL: Record<PreferenceStrength, string> = { required: 'Required', preferred: 'Preferred', any: 'Any' };

/** Compact pill segmented control: Required · Preferred · Any. One per preference row. */
export function PreferenceStrengthSelector({ value, onChange, label }: { value: PreferenceStrength; onChange: (s: PreferenceStrength) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={`${label} strength`} className="inline-flex h-7 p-0.5 rounded-full bg-surface-elevated shrink-0">
      {PREFERENCE_STRENGTHS.map((s) => {
        const selected = s === value;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(s)}
            className={`px-2.5 rounded-full text-micro font-medium tracking-wide motion focus-ring ${selected ? 'bg-ivory text-on-ivory' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {LABEL[s]}
          </button>
        );
      })}
    </div>
  );
}
