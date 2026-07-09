// ─────────────────────────────────────────────────────────────────────────────
// theme.js — kbridge's editorial palette and type, ported from the web app
// (src/App.jsx FontLoader + Tailwind classes). Fraunces/JetBrains Mono become
// the platform serif/mono so no font files need to ship.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';

export const colors = {
  bg: '#0e0d0b',
  raised: '#151310',
  line: '#3a352d',
  text: '#e8e0d0',
  muted: '#8a7f6a',
  faint: '#5a5349',
  accent: '#c4956c',
  accentBright: '#d4a47c',
  danger: '#d4928f',
  dangerDim: '#8b5a5a',
};

export const fonts = {
  display: Platform.select({ ios: 'Georgia', android: 'serif' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace' }),
};

export const spacing = (n) => n * 8;

// Portrait gradients 1–8 from the web app's CSS, as LinearGradient stops.
export const GRADIENTS = [
  ['#3d2817', '#6b4423', '#8b6d47'],
  ['#2d3a2d', '#4a5d3a', '#7a8a6a'],
  ['#4a2d2d', '#6b3a3a', '#8b5a5a'],
  ['#2d2d4a', '#3a3a6b', '#5a5a8b'],
  ['#3d2d4a', '#5a3a6b', '#8b6aa8'],
  ['#4a3a2d', '#6b5a3a', '#a88a5a'],
  ['#1e2a3a', '#2a4055', '#4a6d8a'],
  ['#3a1e2a', '#55283a', '#8a4a6b'],
];
