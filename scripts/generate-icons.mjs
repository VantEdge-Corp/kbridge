#!/usr/bin/env node
/**
 * Draws the Peaches "P" monogram assets in the shadcn/ui Neutral palette:
 * the app icon, splash mark, Android adaptive layers, and favicons. The
 * letter is Georgia, the one place the brand serif appears, so run this on a
 * machine that has Georgia installed (macOS and Windows do).
 *
 *   node scripts/generate-icons.mjs
 *
 * Chromium (from @playwright/test) renders each asset on a canvas, so the
 * glyph is centered on its measured ink box rather than on font metrics.
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'package.json'));
const { chromium } = require('@playwright/test');

/** `--background` and `--foreground` of the Neutral dark theme. */
const INK = '#0a0a0a';
const PAPER = '#fafafa';

/**
 * size: square edge in px. glyph: cap height as a share of the edge.
 * ground: 'square' fills, 'rounded' fills a rounded square (radius share), 'none' stays transparent.
 */
const ASSETS = [
  { file: 'apps/mobile/assets/icon.png', size: 1024, glyph: 0.46, ground: 'square', color: PAPER },
  { file: 'apps/mobile/assets/splash-icon.png', size: 1024, glyph: 0.46, ground: 'rounded', radius: 0.215, color: PAPER },
  { file: 'apps/mobile/assets/android-icon-foreground.png', size: 512, glyph: 0.3, ground: 'none', color: PAPER },
  { file: 'apps/mobile/assets/android-icon-background.png', size: 512, glyph: 0, ground: 'square', color: PAPER },
  { file: 'apps/mobile/assets/android-icon-monochrome.png', size: 432, glyph: 0.3, ground: 'none', color: '#ffffff' },
  { file: 'apps/mobile/assets/favicon.png', size: 48, glyph: 0.37, ground: 'rounded', radius: 0.1875, color: PAPER },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
await page.evaluate(() => document.fonts.load('100px Georgia'));

for (const asset of ASSETS) {
  const dataUrl = await page.evaluate(
    ({ asset, ink }) => {
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
      if (asset.glyph > 0) {
        // Size the font so the letter's ink height hits the target, then center the ink box.
        ctx.font = '100px Georgia';
        const probe = ctx.measureText('P');
        const inkHeight = probe.actualBoundingBoxAscent + probe.actualBoundingBoxDescent;
        const fontSize = (100 * asset.size * asset.glyph) / inkHeight;
        ctx.font = `${fontSize}px Georgia`;
        const m = ctx.measureText('P');
        const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
        const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        const x = (asset.size - width) / 2 + m.actualBoundingBoxLeft;
        const y = (asset.size - height) / 2 + m.actualBoundingBoxAscent;
        ctx.fillStyle = asset.color;
        ctx.fillText('P', x, y);
      }
      return canvas.toDataURL('image/png');
    },
    { asset, ink: INK },
  );
  writeFileSync(path.join(root, asset.file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`wrote ${asset.file}`);
}

await browser.close();
