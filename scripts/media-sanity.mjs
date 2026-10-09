import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import ts from 'typescript';
const moduleUrl = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const retiredCode = ts.transpileModule(await readFile('src/lib/retired-preset-images.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const mediaCode = ts.transpileModule(await readFile('src/lib/shea-media.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText.replace('"./retired-preset-images"', JSON.stringify(moduleUrl(retiredCode)));
const contentCode = ts.transpileModule(await readFile('src/lib/shea-content.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText.replace('"./shea-media"', JSON.stringify(moduleUrl(mediaCode)));
const { clearPresetImage } = await import(moduleUrl(mediaCode));
const { sanitizeSheaMediaConfig, sheaHeroSlides } = await import(moduleUrl(contentCode));
for (const source of ['/assets/website-edits/facial-oils.jpg', '/assets/shea-hero.png', 'https://example.invalid/assets/website-edits/facial-oils.jpg', '/%61ssets/shea-hero.png']) assert.equal(clearPresetImage(source), '');
for (const source of ['/api/media?id=owner-image', '/uploads/my-photo.jpg', '/assets/my-new-banner.jpg', 'https://example.invalid/my-photo.jpg']) assert.equal(clearPresetImage(source), source);
assert.deepEqual(sanitizeSheaMediaConfig({ heroSlides: [], images: [], videos: [] }), { heroSlides: [], images: [], videos: [] });
const changed = { ...sheaHeroSlides[0], title: 'Owner edited copy', src: '' };
assert.equal(sanitizeSheaMediaConfig({ heroSlides: [changed], images: [], videos: [] }).heroSlides[0].title, changed.title, 'Copy edits work before photos are uploaded');
assert.equal(sanitizeSheaMediaConfig({ heroSlides: [{ ...changed, src: '/assets/shea-hero.png' }], images: [{ id: 'legacy', type: 'image', src: '/assets/shea-hero.png' }], videos: [] }).images.length, 0);
console.log('PASS: preset retirement, owner-upload preservation, empty-library persistence, and copy-only editing.');

const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_BROWSER_PATH || undefined });
const base = process.env.SMOKE_URL || 'http://localhost:3140';
await mkdir('artifacts/media', { recursive: true });
const results = [];
try {
  const response = await fetch(base + '/api/storefront/content');
  assert.equal(response.status, 200);
  const { data } = await response.json();
  const fixture = (width, height) => 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#e4e7dc"/><rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="#173d2b" stroke-width="8"/><text x="50%" y="50%" text-anchor="middle" fill="#173d2b" font-size="60">${width} × ${height}</text></svg>`).toString('base64');
  // Browser-only fixtures exercise owner-selected media without writing test banners to the store.
  const slides = [
    { ...sheaHeroSlides[0], id: 'qa-landscape', title: 'Landscape image', src: fixture(1600, 600) },
    { ...sheaHeroSlides[1], id: 'qa-portrait', title: 'Portrait image', src: fixture(600, 1200) }
  ];
  for (const [width, height] of [[320, 844], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 768, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/storefront/content', route => route.fulfill({ json: { data: { ...data, media: { ...data.media, heroSlides: slides } } } }));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const carousel = page.getByRole('region', { name: 'Campaign slides', exact: true });
    await carousel.getByRole('heading', { name: 'Landscape image' }).waitFor();
    for (const [index, dimensions] of [[0, [1600, 600]], [1, [600, 1200]]]) {
      await carousel.getByRole('button', { name: `Campaign ${index + 1}`, exact: true }).click();
      const image = carousel.locator('img');
      await image.evaluate(element => element.decode());
      const fit = await image.evaluate(element => {
        const style = getComputedStyle(element), box = element.getBoundingClientRect();
        const scale = Math.min(box.width / element.naturalWidth, box.height / element.naturalHeight);
        return { objectFit: style.objectFit, transform: style.transform, natural: [element.naturalWidth, element.naturalHeight], width: box.width, height: box.height, renderedWidth: element.naturalWidth * scale, renderedHeight: element.naturalHeight * scale };
      });
      assert.equal(fit.objectFit, 'contain');
      assert.equal(fit.transform, 'none');
      assert.deepEqual(fit.natural, dimensions);
      assert.ok(fit.renderedWidth <= fit.width + 1 && fit.renderedHeight <= fit.height + 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: `artifacts/media/${index ? 'portrait' : 'landscape'}-${width}x${height}.png`, animations: 'disabled' });
      results.push({ width, height, image: index ? 'portrait' : 'landscape', ...fit });
    }
    await carousel.focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await carousel.locator('h1').innerText(), 'Landscape image');
    await page.keyboard.press('ArrowRight');
    assert.equal(await carousel.locator('h1').innerText(), 'Portrait image');
    assert.equal(await carousel.getByRole('button', { name: 'Play campaigns', exact: true }).count(), 1);
    if (width < 768) {
      const box = await page.getByTestId('campaign-stage').boundingBox();
      const y = box.y + 30;
      const session = await context.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: width - 40, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 40, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(() => document.querySelector('[data-live-content] h1')?.textContent === 'Landscape image');
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await writeFile('artifacts/media/results.json', JSON.stringify(results, null, 2));
  console.log(`PASS: ${results.length} landscape/portrait fitting checks, keyboard controls, reduced motion, and zero overflow/errors (browser-only fixtures).`);

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  let config = { heroSlides: [], images: [], videos: [] }, uploads = 0, saves = 0;
  await page.route('**/api/admin/content', async route => {
    const request = route.request();
    if (request.method() === 'PUT') {
      saves++;
      if (saves === 1) return route.fulfill({ status: 503, json: { error: 'QA: storage temporarily unavailable' } });
      config = request.postDataJSON().media;
      return route.fulfill({ json: { data: { media: config, persisted: true } } });
    }
    return route.fulfill({ json: { data: { ...data, media: config, persisted: true } } });
  });
  await page.route('**/api/admin/upload', route => {
    uploads++;
    return uploads === 1 ? route.fulfill({ status: 503, json: { error: 'QA: upload temporarily unavailable' } }) : route.fulfill({ status: 201, json: { data: { url: fixture(1600, 600) } } });
  });
  await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-admin-ready="true"]').waitFor();
  await page.locator('.shea-admin-sidebar').getByRole('button', { name: 'Media library', exact: true }).click();
  await page.getByRole('button', { name: 'Add media', exact: true }).click();
  const form = page.locator('.shea-admin-product-form');
  await form.getByLabel('Title', { exact: true }).fill('Owner campaign');
  const upload = form.locator('input[type=file]');
  const file = { name: 'qa-fixture.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKioAAAAASUVORK5CYII=', 'base64') };
  await upload.setInputFiles(file);
  await page.getByText('QA: upload temporarily unavailable', { exact: true }).waitFor();
  await upload.setInputFiles(file);
  await form.locator('.shea-admin-upload-preview').waitFor();
  await form.getByRole('button', { name: 'Create media', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'QA: storage temporarily unavailable' }).waitFor();
  assert.equal(config.heroSlides.length, 0, 'A failed save must not publish the draft');
  await form.getByRole('button', { name: 'Create media', exact: true }).click();
  await form.getByRole('button', { name: 'Save media changes', exact: true }).waitFor();
  assert.equal(config.heroSlides.length, 1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-admin-ready="true"]').waitFor();
  await page.locator('.shea-admin-sidebar').getByRole('button', { name: 'Media library', exact: true }).click();
  await page.getByRole('heading', { name: 'Edit media', exact: true }).waitFor();
  assert.equal(await page.locator('.shea-admin-product-form').getByLabel('Title', { exact: true }).inputValue(), 'Owner campaign');
  console.log('PASS: browser-isolated upload failure/retry, save failure/retry, and saved-media reload.');
  await context.close();
} finally { await browser.close(); }
