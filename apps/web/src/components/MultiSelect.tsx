import { useMemo, useState } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Icon } from './icons';
import { inputClass } from './Field';
import { TagChip } from './TagChip';

export interface MultiOption {
  value: string;
  label: string;
}

/** Summary button that opens a searchable checklist dialog. Multi-value selections use OR semantics. */
export function MultiSelect({
  label,
  options,
  values,
  onChange,
  searchable = false,
  max,
  placeholder = 'Any',
}: {
  label: string;
  options: ReadonlyArray<MultiOption>;
  values: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  max?: number;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (value: string) => {
    if (values.includes(value)) onChange(values.filter((v) => v !== value));
    else if (!max || values.length < max) onChange([...values, value]);
  };

  const summary = values.slice(0, 3);
  const extra = values.length - summary.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${values.length ? values.map((v) => byValue.get(v) ?? v).join(', ') : placeholder}`}
        className={`${inputClass} min-h-11 py-1.5 flex items-center justify-between gap-2 text-left hover:border-border-strong`}
      >
        <span className="flex flex-wrap gap-1.5 min-w-0">
          {values.length === 0 ? (
            <span className="text-text-muted">{placeholder}</span>
          ) : (
            <>
              {summary.map((v) => (
                <TagChip key={v} className="h-7 px-2.5 text-caption">
                  {byValue.get(v) ?? v}
                </TagChip>
              ))}
              {extra > 0 ? <span className="self-center text-caption text-text-muted">+{extra}</span> : null}
            </>
          )}
        </span>
        <Icon name="chevronDown" size={18} className="shrink-0 text-text-muted" />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        footer={
          <>
            {values.length > 0 ? (
              <Button variant="ghost" onClick={() => onChange([])}>
                Clear
              </Button>
            ) : null}
            <Button onClick={() => setOpen(false)}>Done</Button>
          </>
        }
      >
        {searchable ? (
          <div className="relative mb-3">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label={`Search ${label}`}
              className={`${inputClass} h-11 pl-10`}
            />
          </div>
        ) : null}
        {max ? (
          <p className="text-caption text-text-muted mb-2">
            {values.length} of {max} selected
          </p>
        ) : null}
        <ul className="max-h-[55dvh] overflow-y-auto -mx-2">
          {filtered.map((o) => {
            const checked = values.includes(o.value);
            const disabled = !checked && !!max && values.length >= max;
            return (
              <li key={o.value}>
                <label className={`flex items-center gap-3 px-2 min-h-11 rounded-md cursor-pointer hover:bg-surface-hover ${disabled ? 'opacity-50' : ''}`}>
                  <input type="checkbox" className="h-4 w-4 accent-[#f1ece2]" checked={checked} disabled={disabled} onChange={() => toggle(o.value)} />
                  <span className="text-body text-text">{o.label}</span>
                </label>
              </li>
            );
          })}
          {filtered.length === 0 ? <li className="px-2 py-3 text-body-sm text-text-muted">No matches.</li> : null}
        </ul>
      </Dialog>
    </>
  );
}
