import { useEffect } from 'react';
import { BRAND } from '@peaches/core';

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND.name}` : BRAND.name;
  }, [title]);
}
