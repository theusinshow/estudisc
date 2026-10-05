import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptFolder = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptFolder, '../../..');
const folder = resolve(root, '.local/science-integration/media');
const manifest = JSON.parse(await readFile(resolve(folder, 'assets.json'), 'utf8'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = [];
try {
  for (const asset of manifest.assets) {
    const svg = await readFile(resolve(root, asset.path), 'utf8');
    await page.setContent(svg);
    const textBounds = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      const width = svg.viewBox.baseVal.width;
      const height = svg.viewBox.baseVal.height;
      return [...document.querySelectorAll('text')].map(text => {
        const bounds = text.getBBox();
        return { fits: bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height };
      });
    });
    if (!textBounds.every(value => value.fits)) throw new Error(`Clipped text: ${asset.requestId}`);
    const responsive = [];
    for (const width of [320, 360, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(`<style>body{margin:0}img{display:block;width:100%;max-width:360px;height:auto}</style><img alt="draft" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">`);
      const dimensions = await page.locator('img').evaluate(async image => {
        await image.decode();
        const box = image.getBoundingClientRect();
        return { width: box.width, height: box.height, loaded: image.naturalWidth > 0, overflow: document.documentElement.scrollWidth > window.innerWidth };
      });
      if (!dimensions.loaded || dimensions.overflow || dimensions.width !== Math.min(width, 360)) throw new Error(`Mobile rendering failure: ${asset.requestId} at ${width}`);
      responsive.push({ viewportWidth: width, ...dimensions });
      if (width === 320 && ['COMP-CIE-06-001', 'COMP-CIE-25-001', 'COMP-CIE-40-001'].includes(asset.requestId)) {
        await page.locator('img').screenshot({ path: resolve(folder, `${asset.requestId.toLowerCase()}-preview.png`) });
      }
    }
    results.push({ requestId: asset.requestId, textBoundsWithinSvg: true, responsive });
  }
  await writeFile(resolve(folder, 'browser-validation.json'), `${JSON.stringify({ status: 'PASSED_RENDER_CHECKS', humanVisualReview: 'PENDING', humanFactualReview: 'PENDING', results }, null, 2)}\n`);
  console.log(`Chromium verified ${results.length} SVGs: all text within bounds; images loaded without horizontal overflow at 320/360/1280px. Three preview PNGs created; no review approval recorded.`);
} finally {
  await browser.close();
}
