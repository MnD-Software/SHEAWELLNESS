import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_BROWSER_PATH || undefined });
const base = process.env.SMOKE_URL || 'http://localhost:3140';
await mkdir('artifacts/chrome', { recursive: true });
const api = await browser.newContext();
const data = (await (await api.request.get(base + '/api/storefront/content', { timeout: 90000 })).json()).data;
const product = data.products.find(item => item.status === 'active' && item.inventoryQty > 3);
assert.ok(product);
const routes = ['/', '/shop', '/face', '/skin', '/hair', '/contact', '/about', '/products', '/products/' + product.id, '/account', '/faq', '/wellness-guides'];
const results = [];
try {
  for (const width of [320, 390, 430, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 });
    const page = await context.newPage();
    page.setDefaultTimeout(90000);
    page.setDefaultNavigationTimeout(90000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-cart-ready="true"]').waitFor();
    await page.evaluate(line => localStorage.setItem('sheaWellnessCart', JSON.stringify([line])), { productId: product.id, size: product.sizes[0], quantity: 2 });
    let baseline;
    let expectedCount = 2;
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.locator('[data-cart-ready="true"]').waitFor();
      const header = page.getByTestId('global-header');
      assert.equal(await header.count(), 1, route + ' duplicate headers');
      const box = await header.boundingBox();
      if (!baseline) baseline = box;
      assert.deepEqual(box, baseline, `${route} header differs at ${width}`);
      const count = page.getByTestId('header-cart').locator('b');
      assert.equal(await count.innerText(), String(expectedCount), route + ' cart count');
      const url = page.url();
      await page.getByTestId('header-cart').click();
      const drawer = page.locator('.commerce-drawer.open');
      await drawer.waitFor({ state: 'visible' });
      assert.equal(page.url(), url, route + ' cart should not redirect');
      assert.equal(await drawer.locator('.commerce-cart-lines article').count(), 1);
      assert.equal(await drawer.locator('.commerce-qty span').innerText(), String(expectedCount));
      if (route === '/') {
        await drawer.locator('.commerce-qty button').nth(1).click();
        expectedCount = 3;
        assert.equal(await count.innerText(), '3');
      }
      await drawer.getByRole('button', { name: 'Close cart', exact: true }).click();
      await drawer.waitFor({ state: 'hidden' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `${route} overflow at ${width}`);
      assert.deepEqual(errors, [], `${route} browser exceptions`);
      if (route === '/' && width < 768) {
        const campaign = page.locator('[data-live-content]');
        const campaignBox = await campaign.boundingBox();
        const headingSize = await campaign.locator('h1').evaluate(element => parseFloat(getComputedStyle(element).fontSize));
        assert.ok(campaignBox.y - (box.y + box.height) <= 25, 'Unexpected gap below mobile header');
        assert.ok(campaignBox.height <= 650, 'Mobile campaign is disproportionately tall');
        assert.ok(headingSize <= 32, 'Legacy styles enlarged the mobile campaign heading');
      }
      if (['/', '/face', '/contact', '/products/' + product.id].includes(route)) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ animations: 'disabled', path: `artifacts/chrome/${route === '/' ? 'home' : route.split('/').pop()}-${width}.png` });
      }
      results.push({ route, width, header: box, cartCount: expectedCount, overflow });
      console.log(`PASS ${width} ${route}: matching header, shared cart, no overflow`);
    }
    await context.close();
  }
  await writeFile('artifacts/chrome/results.json', JSON.stringify(results, null, 2));
  console.log(`PASS: ${results.length} cross-page header/cart checks across six device widths.`);
} finally { await api.close(); await browser.close(); }
