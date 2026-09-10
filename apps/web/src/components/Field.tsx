import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

/** Shared input look: 44px, surface, 1px border, radius md, focus ring. */
export const inputClass =
  'w-full bg-surface border border-border rounded-md px-3.5 text-body text-text placeholder:text-text-muted motion input-ring disabled:opacity-60';

export function Label({ htmlFor, children, hint, optional = false }: { htmlFor?: string; children: ReactNode; hint?: ReactNode; optional?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-1.5">
      <span className="flex items-baseline gap-1.5 min-w-0">
        <label htmlFor={htmlFor} className="text-body-sm text-text-secondary">
          {children}
        </label>
        {optional ? <span className="text-caption text-text-muted">Optional</span> : null}
      </span>
      {hint ? <span className="text-caption text-text-muted shrink-0">{hint}</span> : null}
    </div>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-body-sm text-danger">
      {children}
    </p>
  );
}

export function HelpText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-body-sm text-text-muted">{children}</p>;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  help?: ReactNode;
  optional?: boolean;
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, help, optional, error, id, className = '', ...rest }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      {label ? (
        <Label htmlFor={inputId} hint={hint} optional={optional}>
          {label}
        </Label>
      ) : null}
      <input ref={ref} id={inputId} className={`${inputClass} h-11 ${error ? 'border-danger' : ''} ${className}`} {...rest} />
      {error ? <FieldError>{error}</FieldError> : <HelpText>{help}</HelpText>}
    </div>
  );
});

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  help?: ReactNode;
  optional?: boolean;
  error?: string | null;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, help, optional, error, id, className = '', rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      {label ? (
        <Label htmlFor={inputId} hint={hint} optional={optional}>
          {label}
        </Label>
      ) : null}
      <textarea ref={ref} id={inputId} rows={rows} className={`${inputClass} py-2.5 resize-y ${error ? 'border-danger' : ''} ${className}`} {...rest} />
      {error ? <FieldError>{error}</FieldError> : <HelpText>{help}</HelpText>}
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  help?: ReactNode;
  optional?: boolean;
  error?: string | null;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, help, optional, error, id, className = '', options, placeholder, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      {label ? (
        <Label htmlFor={inputId} hint={hint} optional={optional}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <select ref={ref} id={inputId} className={`${inputClass} h-11 appearance-none pr-10 ${error ? 'border-danger' : ''} ${className}`} {...rest}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {error ? <FieldError>{error}</FieldError> : <HelpText>{help}</HelpText>}
    </div>
  );
});

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string | null;
}

/** The native input styled as an 18px box: surface with a strong border, ivory when checked. */
export const checkboxInputClass =
  'peer appearance-none absolute inset-0 h-full w-full rounded-[5px] border border-border-strong bg-surface motion cursor-pointer ' +
  'checked:bg-ivory checked:border-ivory focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed';

/** Wrap a native checkbox input: `<CheckBox><input type="checkbox" className={checkboxInputClass} /></CheckBox>`. */
export function CheckBox({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block h-[18px] w-[18px] shrink-0 ${className}`}>
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="12"
        height="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute inset-0 m-auto text-on-ivory opacity-0 peer-checked:opacity-100"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

export function Checkbox({ label, error, id, className = '', ...rest }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      <label htmlFor={inputId} className={`flex items-start gap-3 cursor-pointer min-h-11 py-2 ${className}`}>
        <CheckBox className="mt-0.5">
          <input id={inputId} type="checkbox" className={checkboxInputClass} {...rest} />
        </CheckBox>
        <span className="text-body-sm text-text-secondary leading-relaxed">{label}</span>
      </label>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function Toggle({ label, checked, onChange, description }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; description?: ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 min-h-11 py-2 text-left rounded-md focus-ring"
    >
      <span>
        <span className="block text-body text-text">{label}</span>
        {description ? <span className="block text-body-sm text-text-muted">{description}</span> : null}
      </span>
      <span className={`relative inline-block w-10 h-6 rounded-full border motion shrink-0 ${checked ? 'bg-ivory border-ivory' : 'bg-surface border-border-strong'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full motion ${checked ? 'translate-x-4 bg-on-ivory' : 'translate-x-0.5 bg-text-muted'}`} />
      </span>
    </button>
  );
}

/** Uppercase eyebrow. Only for section headers and tiny status words. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-micro uppercase tracking-[1.2px] text-text-muted ${className}`}>{children}</p>;
}

export function Notice({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'danger' }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`border rounded-md bg-surface px-4 py-3 text-body-sm ${tone === 'danger' ? 'border-danger/50 text-danger' : 'border-border text-text-secondary'}`}>
      {children}
    </div>
  );
}
