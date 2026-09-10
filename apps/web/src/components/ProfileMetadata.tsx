import type { ReactNode } from 'react';

export interface MetadataItem {
  label: string;
  value: ReactNode;
}

/** Label/value rows for the Background, Intent, and Lifestyle sections. Empty values are skipped. */
export function ProfileMetadata({ items }: { items: ReadonlyArray<MetadataItem> }) {
  const visible = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== '');
  if (visible.length === 0) return null;
  return (
    <dl className="grid grid-cols-[minmax(96px,140px)_1fr] gap-x-4 gap-y-2.5">
      {visible.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-body-sm text-text-muted">{item.label}</dt>
          <dd className="text-body-sm text-text min-w-0">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
