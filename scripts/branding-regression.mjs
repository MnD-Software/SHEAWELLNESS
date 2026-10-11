import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.SMOKE_URL || 'http://localhost:3143';
const original = (await (await fetch(base + '/api/admin/content')).json()).data;
assert.equal(original.persisted, true);
console.log('Loaded the saved catalogue for branding verification');
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_BROWSER_PATH || undefined });
const results = [];
await mkdir('artifacts/branding', { recursive: true });
const green = '/assets/owner-zips-2026/brand-green.webp';
const gold = '/assets/owner-zips-2026/brand-gold.webp';
const black = '/assets/owner-zips-2026/brand-black.webp';
const blackTitle = original.media.images.find(item => item.src === black)?.title;
const greenTitle = original.media.images.find(item => item.src === green)?.title;
assert.ok(blackTitle && greenTitle);
let draftId;
async function request(path, method = 'GET', body) {
  const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const payload = await response.json(); assert.ok(response.ok, payload.error || response.status); return payload.data;
}
async function openAdmin(page, view) {
  await page.goto(base + '/admin', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-admin-ready=true]').waitFor();
  await page.locator('.shea-admin-sidebar').getByRole('button', { name: view, exact: true }).click();
}
async function logos(page, header, footer) {
  await page.waitForFunction(({ header, footer }) => {
    const top = document.querySelector('header[data-testid=global-header] [data-brand-logo=logoUrl]');
    const bottom = document.querySelector('footer [data-brand-logo=footerLogoUrl]');
    return top?.getAttribute('src') === header && bottom?.getAttribute('src') === footer;
  }, { header, footer });
  await page.locator('footer [data-brand-logo=footerLogoUrl]').evaluate(img => img.decode());
}
try {
  // Isolated UI fixtures publish only into the browser interception.
  let fixture = structuredClone(original);
  fixture.pageOverrides.__brand = { branding: { logoUrl: green, footerLogoUrl: gold } };
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(90000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  console.log('Browser ready for branding verification');
  await page.route('**/api/admin/content', async route => {
    if (route.request().method() === 'PUT') fixture.pageOverrides = route.request().postDataJSON().pageOverrides;
    await route.fulfill({ json: { data: fixture } });
  });
  await page.route('**/api/storefront/content', route => route.fulfill({ json: { data: fixture } }));
  await openAdmin(page, 'Site pages');
  console.log('Opened Site pages');
  await page.getByRole('button', { name: 'Edit shared branding', exact: true }).click();
  await page.locator('.studio-elements > button').first().waitFor();
  console.log('Shared branding preview is ready');
  await page.getByRole('tab', { name: 'Images', exact: true }).click();
  console.log('Opened shared images');
  await page.locator('.studio-elements > button').filter({ hasText: 'Footer logo' }).click();
  console.log('Selected footer logo');
  await page.getByRole('button', { name: 'Choose or upload image', exact: true }).click();
  console.log('Opened logo media picker');
  await page.getByPlaceholder('Search media library').fill(blackTitle);
  await page.getByRole('button', { name: `Choose ${blackTitle}`, exact: true }).click();
  console.log('Selected new footer image');
  await page.getByRole('button', { name: 'Save page changes', exact: true }).click();
  console.log('Submitted footer logo');
  await page.getByRole('status').filter({ hasText: 'Published.' }).waitFor();
  assert.equal(fixture.pageOverrides.__brand.branding.footerLogoUrl, black, 'Visual logo edits use the shared brand identity');
  console.log('PASS visual editor saves the footer logo to shared brand settings');
  await openAdmin(page, 'Settings');
  assert.equal(await page.locator('.studio-brand-assets img[alt="Footer logo"]').getAttribute('src'), black, 'Both editors read the same logo');
  await page.locator('.studio-brand-assets > div').filter({ has: page.locator('img[alt="Footer logo"]') }).getByRole('button', { name: 'Choose or upload', exact: true }).click();
  await page.getByPlaceholder('Search media library').fill(greenTitle);
  await page.getByRole('button', { name: `Choose ${greenTitle}`, exact: true }).click();
  await page.getByRole('button', { name: 'Save brand settings', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Brand settings saved.' }).waitFor();
  assert.equal(fixture.pageOverrides.__brand.branding.footerLogoUrl, green);
  console.log('PASS brand-settings logo selection and save');
  // Historic indexed logo overrides must not undo a newer brand-settings choice.
  fixture.pageOverrides.__global = { ...fixture.pageOverrides.__global, images: { '0': gold, '1': gold, '2': gold } };
  const published = original.products.filter(item => ['active', 'low_stock'].includes(item.status));
  const routes = ['/', '/shop', '/about', '/catalogue', ...published.map(item => '/products/' + item.id),
    '/collections/skin-care', '/collections/face-care', '/collections/hair-care', '/collections/essential-oils'];
  for (const route of routes) {
    const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' }); assert.equal(response.status(), 200, route);
    await logos(page, green, green);
    if (route.startsWith('/products/')) {
      const product = published.find(item => route.endsWith('/' + item.id));
      const source = product.sizeMedia?.[product.sizes[0]]?.imageUrl ?? product.imageUrl;
      await page.waitForFunction(source => document.querySelector('.shea-product-main-image img')?.getAttribute('src') === source, source);
      await page.locator('.shea-product-main-image img').evaluate(img => img.decode());
      assert.equal(await page.locator('.shea-product-buy-panel h1').textContent(), product.title);
    }
    results.push({ route, savedFooterLogo: true });
  }
  console.log(`PASS saved footer/header logos across ${routes.length} routes, including all ${published.length} published products`);
  fixture.pageOverrides.__brand.branding.footerLogoUrl = black;
  await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'sheaContentRevision', newValue: 'verification' })));
  await logos(page, green, black);
  fixture.pageOverrides.__brand.branding.footerLogoUrl = gold;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await logos(page, green, gold);
  // Route transitions from Next Links and browser history must reapply page copy.
  fixture.pageOverrides['/about'] = { texts: { '0': 'Saved brand story verification' } };
  await page.goto(base + '/about', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('main h1')?.textContent === 'Saved brand story verification');
  assert.deepEqual(errors, []);
  results.push({ visualEditorLogo: true, settingsLogo: true, oldOverridePrecedence: true, otherTabRefresh: true, focusRefresh: true, copyRuntime: true });
  await page.close();
  // Inspect Orders and product-editor geometry using real data without changing orders.
  for (const width of [320, 390, 768, 1440, 1832]) {
    const layout = await browser.newPage({ viewport: { width, height: 1000 } }); layout.setDefaultTimeout(90000);
    await openAdmin(layout, 'Orders');
    await layout.locator('.shea-orders-board').waitFor();
    await layout.getByText('Loading orders', { exact: true }).waitFor({ state: 'hidden' });
    assert.equal(await layout.getByText('Orders are unavailable', { exact: true }).count(), 0);
    const cards = await layout.locator('.shea-order-card').evaluateAll(cards => cards.map(card => {
      const panel = card.closest('.shea-admin-panel').getBoundingClientRect();
      const box = card.getBoundingClientRect();
      return { inside: box.left >= panel.left && box.right <= panel.right + 1,
        controlsInside: [...card.querySelectorAll('select')].every(select => { const r = select.getBoundingClientRect(); return r.left >= box.left && r.right <= box.right + 1; }) };
    }));
    assert.ok(cards.every(card => card.inside && card.controlsInside), 'Order cards and selectors fit their column');
    assert.ok(await layout.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await layout.screenshot({ path: `artifacts/branding/orders-${width}.png` });
    await layout.locator('.shea-admin-sidebar').getByRole('button', { name: 'Products', exact: true }).click();
    await layout.getByRole('button', { name: 'Edit', exact: true }).first().click();
    assert.ok(await layout.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Product editor fits');
    await layout.close(); results.push({ width, ordersLayout: true, productEditorLayout: true });
  }
  console.log('PASS Orders cards and product editor at five viewport sizes');
  // Verify product edit persistence using a unique unpublished draft, then remove only it.
  const created = await request('/api/admin/products', 'POST', { title: 'QA logo regression ' + crypto.randomUUID(), description: 'Temporary unpublished editing verification', price: 12, inventoryQty: 1, status: 'draft' });
  draftId = created.id;
  assert.ok((await request('/api/admin/products')).some(item => item.id === draftId), 'Product creation and reads default to the active store');
  const editor = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); editor.setDefaultTimeout(90000);
  await openAdmin(editor, 'Products');
  await editor.getByPlaceholder('Search Shea products, orders, buyers').fill(created.title);
  await editor.getByRole('button', { name: 'Edit', exact: true }).click();
  await editor.getByRole('button', { name: 'Choose from media library', exact: true }).click();
  await editor.getByPlaceholder('Search media library').fill(blackTitle);
  await editor.getByRole('button', { name: `Choose ${blackTitle}`, exact: true }).click();
  await editor.getByRole('button', { name: 'Save product changes', exact: true }).click();
  await editor.getByText('Changes saved', { exact: true }).waitFor();
  const stored = await request('/api/admin/content');
  assert.equal(stored.products.find(item => item.id === draftId).imageUrl, black);
  assert.deepEqual(stored.products.filter(item => item.id !== draftId), original.products, 'Real published catalogue remains untouched');
  assert.deepEqual(stored.media, original.media);
  assert.deepEqual(stored.pageOverrides, original.pageOverrides);
  await editor.close(); results.push({ realProductImageSave: true, publishedCataloguePreserved: true });
  console.log('PASS actual product editor image save and published catalogue preservation');
} catch (error) {
  console.error(error);
  throw error;
} finally {
  if (draftId) {
    const current = await request('/api/admin/content');
    await request('/api/admin/content', 'PUT', { type: 'products', products: current.products.filter(item => item.id !== draftId) });
    assert.ok(!(await request('/api/admin/content')).products.some(item => item.id === draftId));
  }
  await writeFile('artifacts/branding/results.json', JSON.stringify(results, null, 2));
  await browser.close();
}
