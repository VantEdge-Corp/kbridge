export interface Segment<K extends string> {
  key: K;
  label: string;
  count?: number;
}

/** Text tabs: selected is ivory with a 1px underline, others muted. */
export function SegmentedTabs<K extends string>({ segments, value, onChange, className = '' }: { segments: ReadonlyArray<Segment<K>>; value: K; onChange: (key: K) => void; className?: string }) {
  return (
    <div role="tablist" className={`flex gap-5 border-b border-border overflow-x-auto ${className}`}>
      {segments.map((s) => {
        const selected = s.key === value;
        return (
          <button
            key={s.key}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(s.key)}
            className={`relative h-11 text-body-sm whitespace-nowrap focus:outline-none focus-visible:ring-1 focus-visible:ring-border-strong ${selected ? 'text-ivory' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {s.label}
            {s.count ? <span className="ml-1.5 text-caption text-text-muted">{s.count}</span> : null}
            {selected ? <span className="absolute left-0 right-0 -bottom-px h-px bg-ivory" /> : null}
          </button>
        );
      })}
    </div>
  );
}
