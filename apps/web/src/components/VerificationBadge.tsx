import { VERIFICATION_LABEL, type VerificationDimension } from '@peaches/core';
import { Icon } from './icons';

/** Calm, understated verification indicator. Shown only for verified dimensions. */
export function VerificationBadge({
  dimension,
  label,
  size = 14,
  className = '',
}: {
  dimension?: VerificationDimension;
  label?: string | boolean;
  size?: number;
  className?: string;
}) {
  const text = typeof label === 'string' ? label : label === true ? (dimension ? VERIFICATION_LABEL[dimension] : 'Verified') : null;
  const title = dimension ? `${VERIFICATION_LABEL[dimension]} verified` : 'Verified';
  return (
    <span className={`inline-flex items-center gap-1 text-verified ${className}`} title={title} aria-label={title}>
      <Icon name="verified" size={size} />
      {text ? <span className="text-caption">{text}</span> : null}
    </span>
  );
}
