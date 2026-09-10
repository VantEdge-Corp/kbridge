import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-sans font-medium whitespace-nowrap select-none ' +
  'transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-border-strong disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ivory text-on-ivory hover:bg-[#e6e0d4]',
  secondary: 'border border-border text-text hover:bg-surface-hover',
  ghost: 'text-text-secondary hover:text-text hover:bg-surface-hover',
  danger: 'border border-border text-danger hover:bg-surface-hover',
};

const SIZES: Record<Size, string> = {
  md: 'h-11 px-4 text-body',
  sm: 'h-9 px-3 text-body-sm',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', type = 'button', ...rest },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest} />;
});

interface LinkButtonProps extends LinkProps {
  variant?: Variant;
  size?: Size;
}

export function LinkButton({ variant = 'primary', size = 'md', className = '', ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/** Small square icon-only button, 44px touch target. */
export function IconButton({ className = '', type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center w-11 h-11 rounded-md text-text-secondary hover:text-text hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-border-strong ${className}`}
      {...rest}
    />
  );
}
