import { useState } from 'react';
import { MonogramPortrait } from './MonogramPortrait';

/** Main 3:4 portrait with thumbnail selection. Falls back to the monogram portrait. */
export function ProfilePhotoGallery({ name, photos }: { name: string; photos: ReadonlyArray<string> }) {
  const [index, setIndex] = useState(0);
  const current = photos[index] ?? photos[0];
  return (
    <div>
      <div className="aspect-[3/4] w-full rounded-[14px] overflow-hidden border border-border bg-surface">
        {current ? <img src={current} alt={`${name}'s photo ${index + 1}`} className="h-full w-full object-cover" /> : <MonogramPortrait name={name} className="h-full w-full" fontSize={96} />}
      </div>
      {photos.length > 1 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto" role="tablist" aria-label="Photos">
          {photos.map((p, i) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`shrink-0 w-14 h-[74px] rounded-md overflow-hidden border ${i === index ? 'border-ivory' : 'border-border opacity-70 hover:opacity-100'}`}
            >
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
