import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export const inputClass =
  'w-full bg-surface border border-border rounded-md px-3 text-body text-text placeholder:text-text-faint ' +
  'focus:outline-none focus:border-border-strong disabled:opacity-60';

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-1.5">
      <label htmlFor={htmlFor} className="text-body-sm text-text-secondary">
        {children}
      </label>
      {hint ? <span className="text-caption text-text-muted">{hint}</span> : null}
    </div>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-caption text-danger">
      {children}
    </p>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, id, className = '', ...rest }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      {label ? (
        <Label htmlFor={inputId} hint={hint}>
          {label}
        </Label>
      ) : null}
      <input ref={ref} id={inputId} className={`${inputClass} h-11 ${error ? 'border-danger' : ''} ${className}`} {...rest} />
      <FieldError>{error}</FieldError>
    </div>
  );
});

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, id, className = '', rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      {label ? (
        <Label htmlFor={inputId} hint={hint}>
          {label}
        </Label>
      ) : null}
      <textarea ref={ref} id={inputId} rows={rows} className={`${inputClass} py-2.5 resize-y ${error ? 'border-danger' : ''} ${className}`} {...rest} />
      <FieldError>{error}</FieldError>
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className = '', options, placeholder, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      {label ? (
        <Label htmlFor={inputId} hint={hint}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <select ref={ref} id={inputId} className={`${inputClass} h-11 appearance-none pr-9 ${error ? 'border-danger' : ''} ${className}`} {...rest}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
});

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string | null;
}

export function Checkbox({ label, error, id, className = '', ...rest }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      <label htmlFor={inputId} className={`flex items-start gap-3 cursor-pointer min-h-11 py-2 ${className}`}>
        <input id={inputId} type="checkbox" className="mt-1 h-4 w-4 accent-[#f1ece2] shrink-0" {...rest} />
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
      className="w-full flex items-center justify-between gap-4 min-h-11 py-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-border-strong rounded-md"
    >
      <span>
        <span className="block text-body text-text">{label}</span>
        {description ? <span className="block text-caption text-text-muted">{description}</span> : null}
      </span>
      <span className={`relative inline-block w-10 h-6 rounded-full border transition-colors ${checked ? 'bg-ivory border-ivory' : 'bg-surface border-border-strong'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full transition-transform ${checked ? 'translate-x-4 bg-on-ivory' : 'translate-x-0.5 bg-text-muted'}`} />
      </span>
    </button>
  );
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-micro uppercase tracking-[1.2px] text-text-muted ${className}`}>{children}</p>;
}

export function Notice({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'danger' }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`border rounded-md px-3 py-2.5 text-body-sm ${tone === 'danger' ? 'border-danger/60 text-danger' : 'border-border text-text-secondary'}`}>
      {children}
    </div>
  );
}
