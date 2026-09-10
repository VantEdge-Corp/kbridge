import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** The left rail and the Explore sidebar appear from 768px. */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)');

/** The two-pane inbox appears from 1024px. */
export const useIsWide = () => useMediaQuery('(min-width: 1024px)');
