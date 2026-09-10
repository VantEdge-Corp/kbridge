import { card } from '@peaches/core';

export const PAGE_PADDING = card.pagePadding;
export const GRID_GAP = card.gap;

/** Two-column person card width for the current window. */
export function cardWidthFor(windowWidth: number): number {
  return Math.floor((windowWidth - PAGE_PADDING * 2 - GRID_GAP) / card.columns);
}

export function cardHeightFor(width: number): number {
  return Math.round(width / card.aspectRatio);
}
