import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:3152';
const editor = ts.transpileModule(await fs.readFile('src/lib/page-editor.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 }
}).outputText;
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 1000 }, reducedMotion: 'reduce' });
  await page.goto(`${base}/about`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.locator('html[data-cms-hydrated="true"]').waitFor({ state: 'attached' });
  assert.equal(await page.locator('main > section').first().getAttribute('class'), 'shea-living-section');
  assert.equal(await page.locator('main h1').count(), 1);
  assert.equal(await page.locator('.shea-living-section h1').count(), 1);

  // Existing saved indices must still resolve to their original content after the move.
  const slots = await page.evaluate(async code => {
    const { editorNodes } = await import(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })));
    const images = editorNodes(document, 'image');
    const texts = editorNodes(document, 'text');
    const sections = editorNodes(document, 'section');
    return {
      heroPhoto: !!images[0]?.closest('.shea-page-hero'),
      communityPhoto: !!images[1]?.closest('.shea-story-opening'),
      ownerPhoto: !!images[2]?.closest('.shea-living-section'),
      heroHeading: !!texts[0]?.closest('.shea-page-hero'),
      ownerHeading: !!texts[50]?.matches('.shea-living-section h1'),
      heroEyebrow: !!texts[54]?.matches('.shea-page-hero > div > span'),
      heroSection: sections[0]?.classList.contains('shea-page-hero'),
      storySection: sections[1]?.classList.contains('shea-complete-story'),
      ownerSection: sections[2]?.classList.contains('shea-living-section')
    };
  }, editor);
  for (const [slot, retained] of Object.entries(slots)) assert.equal(retained, true, slot);
  for (const link of await page.locator('.shea-story-navigation a').all()) {
    const target = await link.getAttribute('href');
    assert.equal(await page.locator(target).count(), 1, target);
  }
  await page.locator('.shea-living-section img').evaluate(image => image.decode());
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(1000);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px overflow`);
    const photo = await page.locator('.shea-living-section img').evaluate(image => ({
      natural: image.naturalWidth / image.naturalHeight,
      displayed: image.width / image.height
    }));
    assert.ok(Math.abs(photo.natural - photo.displayed) < .02, `${width}px owner portrait cropped`);
  }
  console.log('PASS owner introduction, complete portrait, story navigation and saved admin editor slots.');
} finally {
  await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 3000))]);
}
process.exit();
