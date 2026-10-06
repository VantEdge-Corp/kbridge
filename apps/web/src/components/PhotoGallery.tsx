import { useState } from 'react';
import { Portrait } from '@/components/PersonAvatar';
import { cn } from '@/lib/utils';

/** The main 4:5 portrait with a thumbnail strip to switch photos. Falls back to the initial. */
export function PhotoGallery({ name, photos }: { name: string; photos: ReadonlyArray<string> }) {
  const [index, setIndex] = useState(0);
  const current = photos[index] ?? photos[0] ?? null;
  return (
    <div className="grid gap-3">
      <Portrait name={name} src={current} alt={current ? `${name}'s photo ${index + 1}` : ''} className="aspect-[4/5] w-full rounded-xl" initialClassName="text-9xl" />
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto p-0.5" role="tablist" aria-label="Photos">
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-md outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50',
                i === index ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-60 hover:opacity-100',
              )}
            >
              <img src={photo} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
