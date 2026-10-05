import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.SMOKE_URL || 'http://localhost:3140';
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_BROWSER_PATH || undefined });
const routes = ['/', '/shop', '/face', '/skin', '/hair', '/wellness-gifts', '/spa-essentials', '/products', '/about', '/catalogue', '/quality', '/sustainability', '/blog', '/contact', '/wholesale', '/wellness-guides', '/faq', '/account', '/policies', '/shipping-policy', '/refund-policy', '/collections/face-care', '/collections/skin-care', '/admin'];
const results = [];
await mkdir('artifacts/smoke', { recursive: true });
const api = await browser.newContext({ baseURL: base });
const contentResponse = await api.request.get('/api/storefront/content');
assert.equal(contentResponse.status(), 200);
const content = (await contentResponse.json()).data;
assert.equal(content.persisted, true, 'Smoke gate requires a real Neon catalogue');
const products = content.products.filter(p => ['active', 'low_stock'].includes(p.status));
assert.ok(products.length > 0, 'A real published Neon catalogue is required');
routes.push(...products.map(p => '/products/' + encodeURIComponent(p.id)));
routes.push(...['body-care', 'hair-care', 'gift-sets', 'spa-essentials', 'aromatherapy', 'essential-oils'].map(slug => '/collections/' + slug));
assert.equal((await api.request.post('/api/storefront/checkout', { data: {} })).status(), 400);
assert.equal((await api.request.get('/api/admin/content')).status(), process.env.SMOKE_ADMIN_KEY ? 401 : 503);
if (process.env.SMOKE_ADMIN_KEY) {
  const headers = { 'x-shea-admin-key': process.env.SMOKE_ADMIN_KEY };
  for (const path of ['/api/admin/content', '/api/admin/products', '/api/admin/orders', '/api/admin/theme', '/api/admin/enquiries', '/api/admin/settings']) {
    const response = await api.request.get(path, { headers });
    assert.equal(response.status(), 200, path);
  }
  assert.equal((await api.request.post('/api/admin/products', { headers, data: {} })).status(), 400);
}
assert.equal((await api.request.post('/api/storefront/enquiries', { data: {} })).status(), 400);
// Bound memory use on Windows QA machines while retaining the full viewport matrix.
for (const width of [320, 390, 768, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
  const page = await context.newPage();
  let errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of routes) {
    errors = [];
    const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 90000 });
    if (route !== '/admin') await page.locator('[data-cart-ready="true"]').waitFor();
    // Streaming media is not a page-readiness signal. Verify the actual visible images.
    await page.locator('img').evaluateAll(async images => {
      await Promise.all(images.filter(img => {
        const box = img.getBoundingClientRect();
        return box.width > 0 && box.bottom > 0 && box.top < innerHeight;
      }).map(img => img.decode().catch(() => {})));
    });
    const overflow = await page.evaluate(() => ({ viewport: innerWidth, body: document.documentElement.scrollWidth }));
    const broken = await page.locator('img').evaluateAll(images => images.filter(img => img.complete && img.naturalWidth === 0 && img.getBoundingClientRect().width > 0).map(img => img.getAttribute('src')));
    const result = { route, width, status: response.status(), overflow, errors: [...errors], broken };
    results.push(result);
    console.log(JSON.stringify(result));
    await writeFile('artifacts/smoke/results.json', JSON.stringify(results, null, 2));
    assert.equal(response.status(), 200, route);
    assert.ok(overflow.body <= overflow.viewport + 1, `${route} overflows at ${width}: ${overflow.body}`);
    assert.deepEqual(errors, [], `${route} browser errors`);
    assert.deepEqual(broken, [], `${route} broken images`);
    if (route === '/') {
      const carousel = page.getByRole('region', { name: 'Shea Wellness campaigns' });
      // The section names the campaign; controls are scoped to it.
      const section = page.locator('[data-live-content]');
      const heading = section.locator('h1');
      const original = await heading.innerText();
      await section.getByRole('button', { name: 'Next campaign slide', exact: true }).click();
      assert.notEqual(await heading.innerText(), original);
      await section.getByRole('button', { name: 'Previous campaign slide', exact: true }).click();
      assert.equal(await heading.innerText(), original);
      await section.getByRole('button', { name: 'Campaign 2', exact: true }).click();
      assert.equal(await section.getByRole('button', { name: 'Campaign 2', exact: true }).getAttribute('aria-current'), 'true');
      await page.screenshot({ path: `artifacts/smoke/home-${width}.png` });
    }
  }
  await context.close();
}
await writeFile('artifacts/smoke/results.json', JSON.stringify(results, null, 2));
await api.close();
await browser.close();
console.log(`PASS: ${results.length} route/viewport checks, catalogue, checkout validation, admin guard, and carousel controls.`);
