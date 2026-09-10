import { initials } from '@peaches/core';

/** Placeholder portrait for members without photos: warm dark gradient with the first initial in Georgia. */
export function MonogramPortrait({ name, className = '', fontSize }: { name: string; className?: string; fontSize?: number }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-gradient-to-br from-portrait-a to-portrait-b text-ivory font-display ${className}`}
      style={fontSize ? { fontSize } : undefined}
    >
      {initials(name)}
    </div>
  );
}

export function Avatar({ name, src, size = 40, className = '' }: { name: string; src?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (src) {
    return <img src={src} alt="" width={size} height={size} className={`rounded-full object-cover shrink-0 ${className}`} style={style} />;
  }
  return <MonogramPortrait name={name} className={`rounded-full shrink-0 ${className}`} fontSize={Math.round(size * 0.42)} />;
}
