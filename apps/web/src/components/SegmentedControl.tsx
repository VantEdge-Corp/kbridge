import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { cn } from '@/lib/utils';

/**
 * One choice out of a few, drawn like shadcn's Tabs list (a muted track with
 * the chosen segment lifted) but announced as a radio group, which is what it is.
 */
export function SegmentedControl<V extends string>({
  options,
  value,
  onValueChange,
  label,
  size = 'default',
  className,
}: {
  options: ReadonlyArray<{ value: V; label: string }>;
  value: V;
  onValueChange: (value: V) => void;
  /** Accessible name of the group. */
  label: string;
  size?: 'sm' | 'default';
  className?: string;
}) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => onValueChange(next as V)}
      className={cn('inline-flex w-fit shrink-0 items-center rounded-lg bg-muted p-[3px] text-muted-foreground', size === 'sm' ? 'h-8' : 'h-9', className)}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className={cn(
            'inline-flex h-full flex-1 cursor-pointer items-center justify-center rounded-md border border-transparent font-medium whitespace-nowrap transition-all outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            'data-checked:bg-background data-checked:text-foreground data-checked:shadow-sm dark:data-checked:border-input dark:data-checked:bg-input/30',
            size === 'sm' ? 'px-2.5 text-xs' : 'px-3 text-sm',
          )}
        >
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
