#!/usr/bin/env node
/**
 * Draws the Peaches "P" monogram assets in the shadcn/ui Neutral palette:
 * the app icon, splash mark, Android adaptive layers, and favicons. The
 * letter is Cormorant Garamond SemiBold, the display face, taken as an
 * outline straight from the font file (opentype.js), so no installed font is
 * involved and the SVG favicon needs no font at all.
 *
 *   node scripts/generate-icons.mjs
 *
 * Chromium (from @playwright/test) rasterizes the PNGs on a canvas. Each glyph
 * is centered on its own ink box rather than on font metrics.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'package.json'));
const { chromium } = require('@playwright/test');
const opentype = require('opentype.js');

/** `--background` and `--foreground` of the Neutral dark theme. */
const INK = '#0a0a0a';
const PAPER = '#fafafa';

const mobileRequire = createRequire(path.join(root, 'apps/mobile/package.json'));
const fontDir = path.dirname(mobileRequire.resolve('@expo-google-fonts/cormorant-garamond/package.json'));
const fontBytes = readFileSync(path.join(fontDir, '600SemiBold', 'CormorantGaramond_600SemiBold.ttf'));
const font = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));

/** Where to draw the letter so its ink box is `share` of `size` tall and centered in a `size` square. */
function placement(size, share) {
  const box = font.getPath('P', 0, 0, 1000).getBoundingBox();
  const scale = (size * share) / (box.y2 - box.y1);
  return {
    x: (size - (box.x2 - box.x1) * scale) / 2 - box.x1 * scale,
    y: (size - (box.y2 - box.y1) * scale) / 2 - box.y1 * scale,
    fontSize: 1000 * scale,
  };
}

/** The letter as SVG path data, already placed. */
function letterPath(size, share) {
  const { x, y, fontSize } = placement(size, share);
  return font.getPath('P', x, y, fontSize).toPathData(2);
}

/**
 * size: square edge in px. glyph: ink height as a share of the edge.
 * ground: 'square' fills, 'rounded' fills a rounded square (radius share), 'none' stays transparent.
 */
const ASSETS = [
  { file: 'apps/mobile/assets/icon.png', size: 1024, glyph: 0.5, ground: 'square', color: PAPER },
  { file: 'apps/mobile/assets/splash-icon.png', size: 1024, glyph: 0.5, ground: 'rounded', radius: 0.215, color: PAPER },
  { file: 'apps/mobile/assets/android-icon-foreground.png', size: 512, glyph: 0.33, ground: 'none', color: PAPER },
  { file: 'apps/mobile/assets/android-icon-background.png', size: 512, glyph: 0, ground: 'square', color: PAPER },
  { file: 'apps/mobile/assets/android-icon-monochrome.png', size: 432, glyph: 0.33, ground: 'none', color: '#ffffff' },
  { file: 'apps/mobile/assets/favicon.png', size: 48, glyph: 0.5, ground: 'rounded', radius: 0.1875, color: PAPER },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');

for (const asset of ASSETS) {
  const d = asset.glyph > 0 ? letterPath(asset.size, asset.glyph) : '';
  const dataUrl = await page.evaluate(
    ({ asset, ink, d }) => {
      const canvas = document.getElementById('c');
      canvas.width = asset.size;
      canvas.height = asset.size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, asset.size, asset.size);
      ctx.fillStyle = ink;
      if (asset.ground === 'square') ctx.fillRect(0, 0, asset.size, asset.size);
      if (asset.ground === 'rounded') {
        ctx.beginPath();
        ctx.roundRect(0, 0, asset.size, asset.size, asset.size * asset.radius);
        ctx.fill();
      }
      if (d) {
        ctx.fillStyle = asset.color;
        ctx.fill(new Path2D(d));
      }
      return canvas.toDataURL('image/png');
    },
    { asset, ink: INK, d },
  );
  writeFileSync(path.join(root, asset.file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`wrote ${asset.file}`);
}

await browser.close();

// The web favicon stays a vector: a rounded ink square and the letter as a path.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${INK}"/><path fill="${PAPER}" d="${letterPath(64, 0.5)}"/></svg>\n`;
writeFileSync(path.join(root, 'apps/web/public/favicon.svg'), svg);
console.log('wrote apps/web/public/favicon.svg');
