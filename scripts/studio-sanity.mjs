import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.SMOKE_URL || 'http://localhost:3143';
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_BROWSER_PATH || undefined });
await mkdir('artifacts/studio', { recursive: true });
const results = [];
try {
  const response = await fetch(base + '/api/admin/content');
  const payload = await response.json();
  assert.equal(response.status, 200, payload.error);
  const content = payload.data;
  assert.equal(content.persisted, true, 'Real database connection is required');
  for (const variant of ['green', 'gold', 'black']) assert.ok(content.media.images.some(asset => asset.src.endsWith(`brand-${variant}.webp`)), 'Supplied logos are available in the media library');
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); page.setDefaultTimeout(90000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    for (const path of ['/', '/shop', '/about', '/skin', '/admin']) {
      const response = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 90000 });
      assert.equal(response.status(), 200, path);
      await page.locator(path === '/admin' ? '[data-admin-ready=true]' : '[data-cart-ready=true]').waitFor();
      await page.locator('.shea-brand-logo').first().evaluate(img => img.decode());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} fits ${width}px`);
      const broken = await page.locator('img[src]').evaluateAll(images => images.filter(img => img.complete && !img.naturalWidth).map(img => img.src));
      assert.deepEqual(broken, [], path + ' image resources');
      if (path !== '/admin') assert.match(await page.locator('[data-testid=global-header] img').getAttribute('src'), /brand-green/);
      await page.screenshot({ path: `artifacts/studio/${path === '/' ? 'home' : path.slice(1)}-${width}.png`, fullPage: false });
    }
    await page.locator('.shea-admin-sidebar').getByRole('button', { name: 'Site pages', exact: true }).click();
    await page.getByRole('heading', { name: 'Every detail, in your hands.' }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page cards fit viewport');
    await page.screenshot({ path: `artifacts/studio/pages-${width}.png`, fullPage: false });
    await page.locator('.shea-admin-page-grid article').filter({ has: page.getByRole('heading', { name: 'Our story', exact: true }) }).getByRole('button', { name: 'Edit page' }).click();
    await page.locator('.studio-elements > button').first().waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Editor fits viewport');
    await page.getByRole('button', { name: 'Mobile preview', exact: true }).click();
    const frame = page.frameLocator('iframe');
    await frame.locator('main h1').click();
    await page.getByRole('textbox', { name: 'Text content', exact: true }).fill('Your natural ritual, beautifully considered.');
    assert.equal(await frame.locator('main h1').textContent(), 'Your natural ritual, beautifully considered.');
    await page.screenshot({ path: `artifacts/studio/editor-${width}.png`, fullPage: false });
    await page.getByRole('button', { name: 'Undo last change' }).click();
    await page.waitForFunction(() => {
      const heading = document.querySelector('iframe')?.contentDocument?.querySelector('main h1');
      return heading && heading.textContent !== 'Your natural ritual, beautifully considered.';
    });
    assert.notEqual(await frame.locator('main h1').textContent(), 'Your natural ritual, beautifully considered.');
    await page.getByRole('tab', { name: 'Images', exact: true }).click();
    await page.locator('.studio-elements > button').first().click();
    await page.getByRole('button', { name: 'Choose or upload image' }).click();
    await page.getByRole('dialog', { name: 'Choose an image' }).waitFor();
    await page.getByRole('button', { name: 'Close media library' }).click();
    await page.getByRole('tab', { name: 'Links', exact: true }).click();
    await page.locator('.studio-elements > button').first().click();
    assert.ok(await page.getByLabel('Destination', { exact: true }).isVisible());
    await page.getByRole('tab', { name: 'Sections', exact: true }).click();
    await page.locator('.studio-elements > button').first().click();
    await page.getByLabel('Show this section').uncheck();
    assert.equal(await frame.locator('[data-cms-key="section:0"]').evaluate(node => node.hidden), true);
    await page.getByLabel('Show this section').check();
    assert.deepEqual(errors, [], 'No browser exceptions');
    results.push({ width, storefront: true, admin: true, editor: true, undo: true, images: true, links: true, visibility: true });
    console.log(`PASS storefront, branding, editor, undo, media, links and sections at ${width}px`);
    await context.close();
  }
  // Isolated browser fixtures exercise failure/retry and publication without
  // changing a real customer-facing page.
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(90000);
  let fixture = structuredClone(content); let failSave = true; let writes = 0;
  await page.route('**/api/admin/content', async route => {
    if (route.request().method() === 'PUT') {
      writes++;
      if (failSave) { failSave = false; return route.fulfill({ status: 503, json: { error: 'Verification: temporary save failure' } }); }
      fixture.pageOverrides = route.request().postDataJSON().pageOverrides;
    }
    return route.fulfill({ json: { data: fixture } });
  });
  await page.route('**/api/storefront/content', route => route.fulfill({ json: { data: fixture } }));
  await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' }); await page.locator('[data-admin-ready=true]').waitFor();
  await page.locator('.shea-admin-sidebar').getByRole('button', { name: 'Site pages', exact: true }).click();
  await page.getByRole('button', { name: 'Edit shared branding' }).click();
  await page.locator('.studio-elements > button').first().waitFor();
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  await page.locator('.studio-elements > button').first().click();
  await page.getByLabel('Image description', { exact: true }).fill('Shea Wellness supplied logo');
  await page.getByRole('button', { name: 'Save page changes' }).click();
  await page.getByRole('alert').filter({ hasText: 'temporary save failure' }).waitFor();
  assert.equal(await page.getByLabel('Image description', { exact: true }).inputValue(), 'Shea Wellness supplied logo', 'Failed saves retain the draft');
  await page.getByRole('button', { name: 'Save page changes' }).click();
  await page.getByRole('status').filter({ hasText: 'Published.' }).waitFor();
  assert.equal(writes, 2);
  await page.goto(base + '/shop', { waitUntil: 'domcontentloaded' });
  await page.locator('img[alt="Shea Wellness supplied logo"]').waitFor({ state: 'attached' });
  await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-admin-ready=true]').waitFor();
  await page.locator('.shea-admin-sidebar').getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Store name', { exact: true }).fill('Shea Wellness verification');
  await page.getByLabel(/^Announcement bar/).fill('A considered daily ritual');
  await page.getByRole('button', { name: 'Save brand settings', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Brand settings saved.' }).waitFor();
  assert.equal(fixture.pageOverrides.__brand.branding.name, 'Shea Wellness verification');
  assert.equal(fixture.pageOverrides.__brand.branding.announcement, 'A considered daily ritual');
  await page.screenshot({ path: 'artifacts/studio/brand-settings-1440.png', fullPage: false });
  await page.close();
  console.log('PASS isolated save failure, draft retention, retry and global branding runtime');
  results.push({ saveRetry: true, sharedBranding: true, browserFixture: true });

  const delayed = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); delayed.setDefaultTimeout(90000);
  await delayed.route('**/api/storefront/content', async route => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return route.fulfill({ json: { data: content } });
  });
  await delayed.goto(base + '/admin', { waitUntil: 'domcontentloaded' });
  await delayed.locator('[data-admin-ready=true]').waitFor();
  await delayed.locator('.shea-admin-sidebar').getByRole('button', { name: 'Site pages', exact: true }).click();
  await delayed.locator('.shea-admin-page-grid article').filter({ has: delayed.getByRole('heading', { name: 'Catalogue', exact: true }) }).getByRole('button', { name: 'Edit page' }).click();
  await delayed.locator('.studio-elements > button').first().waitFor();
  assert.equal(await delayed.frameLocator('iframe').locator('main').getAttribute('data-cms-content-ready'), 'true');
  const download = content.media.documents?.find(item => item.placements?.includes('downloads'));
  assert.ok(download, 'A real saved brochure is required for the delayed-content check');
  assert.ok(await delayed.locator('.studio-elements > button').filter({ hasText: download.title }).count() > 0, 'Inspector includes brochure content loaded asynchronously');
  await delayed.close(); results.push({ delayedContentReady: true });
  console.log('PASS editor waits for database-loaded brochure content before inspecting the page');

  // Store/read/remove a unique, non-public key to validate the actual database
  // contract without publishing test content to a customer-facing route.
  const key = `/__studio_verification_${crypto.randomUUID()}`;
  const entry = { branding: { name: 'Verification brand', email: 'verification@example.com', announcement: 'Natural care' }, texts: { '0': 'Verification' }, images: { '0': '/assets/owner-zips-2026/brand-green.webp' }, links: { '0': { href: '/shop', label: 'Explore' } }, videos: { '0': { src: '/assets/owner-oct-2026/vanilla-mint.mp4' } }, appearance: { 'section:0': { hidden: true, background: '#faf9f5', spacing: '48' }, 'image:0': { alt: 'Brand logo', fit: 'contain', position: 'center' } } };
  async function read() { const response = await fetch(base + '/api/admin/content'); assert.equal(response.status, 200); return (await response.json()).data; }
  async function save(pageOverrides) { const response = await fetch(base + '/api/admin/content', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'pageOverrides', pageOverrides }) }); assert.equal(response.status, 200, await response.text()); }
  try {
    const current = await read(); await save({ ...current.pageOverrides, [key]: entry });
    const stored = await read(); assert.deepEqual(stored.pageOverrides[key], entry);
    assert.deepEqual(stored.products, current.products, 'Page editing preserves catalogue prices, stock and images');
    assert.deepEqual(stored.media, current.media, 'Page editing preserves the media library');
    const invalid = await fetch(base + '/api/admin/content', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'pageOverrides', pageOverrides: { [key]: { links: { '0': { href: 'javascript:alert(1)' } } } } }) }); assert.equal(invalid.status, 400);
  } finally { const latest = await read(); delete latest.pageOverrides[key]; await save(latest.pageOverrides); assert.equal((await read()).pageOverrides[key], undefined, 'Temporary QA entry was removed'); }
  console.log('PASS real database round-trip, catalogue preservation, invalid destination rejection and exact QA cleanup');
  results.push({ database: true, cataloguePreserved: true, invalidDestinationRejected: true, cleanup: true });
  await writeFile('artifacts/studio/results.json', JSON.stringify(results, null, 2));
} finally { await browser.close(); }
