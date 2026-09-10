import { initials } from '@peaches/core';

/** Placeholder portrait for members without photos: warm dark gradient with the first initial in Georgia. */
export function MonogramPortrait({ name, className = '', fontSize }: { name: string; className?: string; fontSize?: number }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-gradient-to-br from-portrait-b to-portrait-a text-ivory font-display ${className}`}
      style={fontSize ? { fontSize } : undefined}
    >
      {initials(name)}
    </div>
  );
}

/** Always circular; a photo gets a hairline inner ring. */
export function Avatar({ name, src, size = 40, className = '' }: { name: string; src?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (src) {
    return (
      <span className={`relative inline-block shrink-0 rounded-full ${className}`} style={style}>
        <img src={src} alt="" width={size} height={size} className="rounded-full object-cover h-full w-full" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-image-ring" />
      </span>
    );
  }
  return <MonogramPortrait name={name} className={`rounded-full shrink-0 ${className}`} fontSize={Math.round(size * 0.42)} />;
}
