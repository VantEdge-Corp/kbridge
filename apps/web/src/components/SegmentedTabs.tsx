export interface Segment<K extends string> {
  key: K;
  label: string;
  count?: number;
}

/** Text tabs: 14px medium, 20px gap; the selected tab is ivory with a 2px underline hugging the label. */
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
            className={`relative h-11 inline-flex items-center gap-1.5 text-[14px] font-medium whitespace-nowrap motion rounded-sm focus-ring ${selected ? 'text-ivory' : 'text-text-muted hover:text-text-secondary'}`}
          >
            <span>{s.label}</span>
            {s.count ? (
              <span className={`inline-flex h-[18px] min-w-[18px] px-1.5 items-center justify-center rounded-full text-micro font-medium ${selected ? 'bg-ivory text-on-ivory' : 'bg-surface-elevated text-text-secondary'}`}>
                {s.count}
              </span>
            ) : null}
            {selected ? <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-ivory" /> : null}
          </button>
        );
      })}
    </div>
  );
}
