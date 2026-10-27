import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.SMOKE_URL || 'http://localhost:3160';
const out = 'artifacts/oct27-revisions';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const results = [];
const screenshotStyle = 'header[data-testid="global-header"],.commerce-mobile-tabs,.shea-whatsapp-chat,.commerce-drawer { visibility: hidden !important; }';
try {
  const page = await browser.newPage();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of (process.env.CHECK_WIDTHS || '390,1440').split(',').map(Number)) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of (process.env.CHECK_ROUTES === undefined ? ['/face', '/skin', '/hair', '/wellness-gifts', '/spa-essentials'] : process.env.CHECK_ROUTES.split(',').filter(Boolean))) {
      console.log('CHECK', route, width);
      await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.locator('html[data-cms-hydrated="true"]').waitFor({ state: 'attached' });
      const carousel = page.locator('.department-slideshow');
      await carousel.waitFor({ state: 'visible' });
      // The dev toolbar overlaps mobile controls; check the product surface.
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
      await carousel.scrollIntoViewIfNeeded();
      assert.equal(await carousel.getByText('View product', { exact: true }).count(), 0);
      assert.equal(await carousel.locator('strong').count(), 0);
      const controls = await carousel.locator('.department-slideshow-controls button').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().top));
      assert.ok(Math.max(...controls) - Math.min(...controls) < 2, 'Slideshow controls must stay in one row');
      const image = carousel.locator('img');
      await carousel.getByRole('button', { name: 'Pause slideshow', exact: true }).click();
      await image.evaluate(img => Promise.race([img.decode(), new Promise((_, reject) => setTimeout(() => reject(new Error('Photo did not load')), 30000))]));
      console.log('Loaded initial photo', route);
      await carousel.getByRole('button', { name: 'Play slideshow', exact: true }).click();
      const initial = await image.getAttribute('src');
      await page.waitForFunction(src => document.querySelector('.department-slideshow img')?.getAttribute('src') !== src, initial, { timeout: 12000 });
      console.log('Automatic advance confirmed', route);
      await carousel.getByRole('button', { name: 'Pause slideshow', exact: true }).click();
      const pausedImage = await image.getAttribute('src');
      await page.waitForTimeout(4900);
      assert.equal(await image.getAttribute('src'), pausedImage, 'Pause must stop the slideshow');
      await carousel.getByRole('button', { name: 'Next photo', exact: true }).click();
      assert.notEqual(await image.getAttribute('src'), pausedImage);
      await carousel.getByRole('button', { name: 'Play slideshow', exact: true }).click();
      const resumedImage = await image.getAttribute('src');
      await page.waitForFunction(src => document.querySelector('.department-slideshow img')?.getAttribute('src') !== src, resumedImage, { timeout: 12000 });
      if (['/face', '/skin', '/hair'].includes(route)) {
        assert.equal(await page.locator('.department-routine-photo img').count(), 2);
        const expected = { '/face': ['morning.jpeg', 'evening.jpeg'], '/skin': ['dry-flaky.jpeg', 'fresh-glow.jpeg'], '/hair': ['wash-day.jpeg', 'between-washes.jpeg'] }[route];
        const sources = await page.locator('.department-routine-photo img').evaluateAll(images => images.map(img => img.getAttribute('src').split('/').pop()));
        assert.deepEqual(sources, expected, 'Document photographs must be assigned to the correct routine');
        await page.locator('.department-routine-photo img').evaluateAll(async images => { for (const img of images) { img.loading = 'eager'; await img.decode(); } });
        await page.locator('.department-routines').screenshot({ style: screenshotStyle, path: `${out}/${route.slice(1)}-routines-${width}.png` });
      }
      if (route === '/skin' || route === '/wellness-gifts') {
        const gallery = page.locator('.client-collection-gallery');
        assert.equal(await gallery.locator('figure').count(), 1);
        assert.equal(await gallery.locator('figcaption').count(), 0);
        assert.ok((await gallery.locator('img').getAttribute('src')).endsWith(route === '/skin' ? 'product-shea-butter.png' : 'revisions/wellness-gift.jpeg'));
        await gallery.locator('img').evaluate(img => { img.loading = 'eager'; return img.decode(); });
        const geometry = await gallery.evaluate(node => ({ section: node.clientWidth, photo: node.querySelector('img').clientWidth }));
        assert.ok(Math.abs(geometry.section - geometry.photo) < 5);
        await gallery.screenshot({ style: screenshotStyle, path: `${out}/${route.slice(1)}-collection-${width}.png` });
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${route} overflow`);
      const gridLayout = await page.locator('.department-products > div').evaluate(grid => {
        const cards = Array.from(grid.children).map(card => card.getBoundingClientRect());
        return { columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length, firstRow: cards.filter(card => Math.abs(card.top - cards[0].top) < 2).length, count: cards.length };
      });
      if (width <= 700) assert.equal(gridLayout.columns, 2, 'Keep two columns on phones');
      if (width >= 1200 && gridLayout.count >= 4) assert.ok(gridLayout.firstRow >= 4, 'Use the available desktop width');
      await carousel.screenshot({ style: screenshotStyle, path: `${out}/${route.slice(1)}-slideshow-${width}.png` });
      results.push({ route, width, autoplay: true, pause: true, resume: true, overflow: false });
      console.log('PASS', route, width, 'autoplay, pause, resume, supplied photos, layout');
    }
    await page.goto(base + '/about', { waitUntil: 'domcontentloaded' });
    const photo = page.locator('.shea-story-purpose-photo img');
    await photo.evaluate(img => { img.loading = 'eager'; return img.decode(); });
    assert.match(await photo.getAttribute('src'), /shared-care\.jpeg$/);
    assert.ok(await photo.evaluate(img => { const box = img.getBoundingClientRect(); return Math.abs(box.width / box.height - .75) < .01; }));
    await page.locator('#our-purpose').screenshot({ style: screenshotStyle, path: `${out}/purpose-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    results.push({ route: '/about', width, portrait: true, overflow: false });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base + '/skin', { waitUntil: 'domcontentloaded' });
  await page.locator('.department-slideshow').getByRole('button', { name: 'Play slideshow', exact: true }).waitFor();
  const source = await page.locator('.department-slideshow img').getAttribute('src');
  await page.waitForTimeout(4900);
  assert.equal(await page.locator('.department-slideshow img').getAttribute('src'), source);
  assert.deepEqual(errors, []);
  await fs.writeFile(`${out}/results.json`, JSON.stringify({ results, reducedMotion: true, errors }, null, 2));
  console.log('PASS', results.length, 'route/viewport checks; reduced motion; no browser errors');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally { await Promise.race([browser.close(), new Promise(resolve => setTimeout(resolve, 5000))]); }
process.exit(process.exitCode ?? 0);
