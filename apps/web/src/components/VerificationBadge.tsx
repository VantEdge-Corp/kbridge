import { LuBadgeCheck } from 'react-icons/lu';
import { VERIFICATION_LABEL, type VerificationDimension } from '@peaches/core';
import { cn } from '@/lib/utils';

/** The verification seal, shown only for verified dimensions. With `label`, it reads "Verified" or the dimension's name. */
export function VerificationBadge({ dimension, label, className }: { dimension?: VerificationDimension; label?: boolean; className?: string }) {
  const title = dimension ? `${VERIFICATION_LABEL[dimension]} verified` : 'Verified';
  return (
    <span role="img" aria-label={title} title={title} className={cn('inline-flex shrink-0 items-center gap-1 text-verified', className)}>
      <LuBadgeCheck className="size-4" />
      {label ? <span className="text-xs font-medium">{dimension ? VERIFICATION_LABEL[dimension] : 'Verified'}</span> : null}
    </span>
  );
}
