import { initials } from '@peaches/core';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/** Circular photo with the first initial, in the display serif, as the fallback. Size it with a `size-*` class. */
export function PersonAvatar({ name, src, className, fallbackClassName }: { name: string; src?: string | null; className?: string; fallbackClassName?: string }) {
  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback className={cn('font-display text-lg font-semibold', fallbackClassName)}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

/**
 * A member's photo filling its frame with a hairline ring, or their initial in
 * the italic display serif on a muted ground. The parent sets the shape:
 * aspect ratio and radius.
 */
export function Portrait({
  name,
  src,
  alt = '',
  className,
  initialClassName,
  loading,
}: {
  name: string;
  src?: string | null;
  alt?: string;
  className?: string;
  initialClassName?: string;
  loading?: 'lazy' | 'eager';
}) {
  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {src ? (
        <img src={src} alt={alt} loading={loading} className="size-full object-cover" />
      ) : (
        <div aria-hidden="true" className={cn('flex size-full items-center justify-center font-display text-8xl font-medium text-muted-foreground/60 italic select-none', initialClassName)}>
          {initials(name)}
        </div>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset" />
    </div>
  );
}
