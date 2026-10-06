import { useId, useMemo, type ComponentProps, type ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
}

interface FieldChrome {
  label?: ReactNode;
  /** Small text at the right of the label, e.g. a character count. */
  hint?: ReactNode;
  description?: ReactNode;
  error?: string | null;
  optional?: boolean;
  className?: string;
}

/** Label, control, then the description or the error, in shadcn's Field layout. */
function FieldShell({ id, label, hint, description, error, optional, className, children }: FieldChrome & { id: string; children: ReactNode }) {
  return (
    <Field data-invalid={error ? true : undefined} className={cn('gap-2', className)}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          {/* "Optional" stays outside the label so the field's accessible name is just the label. */}
          <div className="flex min-w-0 items-baseline gap-2">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {optional ? <span className="text-xs text-muted-foreground">Optional</span> : null}
          </div>
          {hint ? <span className="text-xs text-muted-foreground tabular-nums">{hint}</span> : null}
        </div>
      ) : null}
      {children}
      {error ? <FieldError>{error}</FieldError> : description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

type InputProps = Omit<ComponentProps<typeof Input>, 'className'>;

export function TextField({ label, hint, description, error, optional, className, id, ...rest }: FieldChrome & InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} hint={hint} description={description} error={error} optional={optional} className={className}>
      <Input id={inputId} aria-invalid={error ? true : undefined} {...rest} />
    </FieldShell>
  );
}

type TextareaProps = Omit<ComponentProps<typeof Textarea>, 'className'>;

export function TextareaField({ label, hint, description, error, optional, className, id, ...rest }: FieldChrome & TextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} hint={hint} description={description} error={error} optional={optional} className={className}>
      <Textarea id={inputId} aria-invalid={error ? true : undefined} className="min-h-24" {...rest} />
    </FieldShell>
  );
}

interface SelectFieldProps extends FieldChrome {
  id?: string;
  options: ReadonlyArray<Option>;
  /** '' means nothing chosen. */
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

/** A short, fixed list. Long lists use `SearchSelectField`. */
export function SelectField({ options, value, onValueChange, placeholder = 'Choose', disabled, id, 'aria-label': ariaLabel, ...chrome }: SelectFieldProps) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const items = useMemo(() => options.map((o) => ({ value: o.value, label: o.label })), [options]);
  return (
    <FieldShell id={triggerId} {...chrome}>
      <Select items={items} value={value || null} onValueChange={(next) => onValueChange(typeof next === 'string' ? next : '')} disabled={disabled}>
        <SelectTrigger id={triggerId} aria-label={ariaLabel} aria-invalid={chrome.error ? true : undefined} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

function useLabels(options: ReadonlyArray<Option>) {
  return useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value, o.label]));
    return { values: options.map((o) => o.value), label: (value: string) => byValue.get(value) ?? value };
  }, [options]);
}

/** One value from a long list, typed to filter. */
export function SearchSelectField({ options, value, onValueChange, placeholder = 'Search', disabled, id, 'aria-label': ariaLabel, ...chrome }: SelectFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const { values, label } = useLabels(options);
  return (
    <FieldShell id={inputId} {...chrome}>
      <Combobox items={values} value={value || null} onValueChange={(next) => onValueChange(typeof next === 'string' ? next : '')} itemToStringLabel={label} autoHighlight disabled={disabled}>
        <ComboboxInput id={inputId} placeholder={placeholder} aria-label={ariaLabel} aria-invalid={chrome.error ? true : undefined} className="w-full" />
        <ComboboxContent>
          <ComboboxEmpty>No matches.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {label(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FieldShell>
  );
}

interface MultiSelectFieldProps extends FieldChrome {
  id?: string;
  options: ReadonlyArray<Option>;
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  'aria-label'?: string;
}

/** Any number of values as removable chips, typed to filter. Multiple values mean "any of these". */
export function MultiSelectField({ options, values, onValuesChange, placeholder = 'Any', max, disabled, id, 'aria-label': ariaLabel, ...chrome }: MultiSelectFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const anchor = useComboboxAnchor();
  const { values: all, label } = useLabels(options);
  const full = max !== undefined && values.length >= max;
  return (
    <FieldShell id={inputId} {...chrome}>
      <Combobox
        multiple
        autoHighlight
        items={all}
        value={values}
        onValueChange={(next) => onValuesChange(Array.isArray(next) ? (next as string[]) : [])}
        itemToStringLabel={label}
        disabled={disabled}
      >
        <ComboboxChips ref={anchor} className="w-full">
          <ComboboxValue>
            {(selected: string[]) => (
              <>
                {selected.map((item) => (
                  <ComboboxChip key={item}>{label(item)}</ComboboxChip>
                ))}
                <ComboboxChipsInput id={inputId} aria-label={ariaLabel} placeholder={selected.length ? '' : placeholder} aria-invalid={chrome.error ? true : undefined} />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No matches.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item} disabled={full && !values.includes(item)}>
                {label(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FieldShell>
  );
}

/** A checkbox with its label to the right. The label may contain links. */
export function CheckboxField({
  label,
  checked,
  onCheckedChange,
  error,
  description,
  disabled,
  className,
  id,
}: {
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string | null;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field orientation="horizontal" data-invalid={error ? true : undefined} className={className}>
      <Checkbox id={inputId} checked={checked} onCheckedChange={(next) => onCheckedChange(next === true)} disabled={disabled} aria-invalid={error ? true : undefined} />
      <FieldContent>
        <FieldLabel htmlFor={inputId} className="font-normal leading-snug">
          {label}
        </FieldLabel>
        {error ? <FieldError>{error}</FieldError> : description ? <FieldDescription>{description}</FieldDescription> : null}
      </FieldContent>
    </Field>
  );
}

/** A setting that is on or off: title and description on the left, the switch on the right. */
export function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
  id,
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field orientation="horizontal" className={cn('items-center justify-between gap-6', className)}>
      <FieldContent>
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
      </FieldContent>
      <Switch id={inputId} checked={checked} onCheckedChange={(next) => onCheckedChange(next === true)} disabled={disabled} />
    </Field>
  );
}
