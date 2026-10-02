// Renders every SVG in a lesson figure folder at phone width (343 px) into one PNG for visual review.
// Usage: node scripts/render-lesson-figures.mjs <LESSON-ID> <output.png>
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const [lessonId, output] = process.argv.slice(2);
if (!lessonId || !output) throw new Error("Usage: node scripts/render-lesson-figures.mjs <LESSON-ID> <output.png>");
const dir = join("packs/seeds/ifsc-2027.lesson-drafts/figures", lessonId);
const figures = readdirSync(dir).filter(file => file.endsWith(".svg")).map(file =>
  `<p style="margin:16px 0 6px;font:700 13px sans-serif">${file}</p><img style="width:343px;border:3px solid #17141F;border-radius:18px;display:block" src="data:image/svg+xml;base64,${readFileSync(join(dir, file)).toString("base64")}">`
).join("");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0;padding:16px;background:#FFF4E0">${figures}</body>`);
await page.waitForTimeout(300);
await page.screenshot({ path: output, fullPage: true });
await browser.close();
console.log(`Rendered ${lessonId} figures to ${output}`);
