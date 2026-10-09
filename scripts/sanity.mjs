import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts/smoke', { recursive: true });
const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.QA_BROWSER_PATH || undefined, headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
page.setDefaultNavigationTimeout(90000);
const base = process.env.SMOKE_URL || 'http://localhost:3140';
const errors = [];
page.on('pageerror', error => errors.push(error.message));
async function visit(route = '') {
  await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  if (route !== '/admin') await page.locator('[data-cart-ready="true"]').waitFor();
}
await visit();
const carousel = page.locator('[data-live-content]');
const campaignData = (await (await context.request.get(base + '/api/storefront/content')).json()).data.media.heroSlides;
if (campaignData.length > 1) {
const firstTitle = await carousel.locator('h1').innerText();
const cdp = await context.newCDPSession(page);
const stage = await page.getByTestId('campaign-stage').boundingBox();
const swipeY = stage.y + Math.min(80, stage.height / 3);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 310, y: swipeY }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 90, y: swipeY }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForFunction(title => document.querySelector('[data-live-content] h1')?.textContent !== title, firstTitle);
await carousel.getByRole('button', { name: 'Previous campaign slide', exact: true }).click();
assert.equal(await carousel.locator('h1').innerText(), firstTitle);
} else {
  assert.equal(await carousel.getByRole('button', { name: 'Next campaign slide', exact: true }).count(), 0, 'Single campaigns do not show redundant controls');
  console.log('PASS: saved single campaign displays without redundant controls; touch for multiple slides is covered by test:media.');
}
await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
await page.locator('.shea-desktop-sidebar.open').waitFor({ state: 'visible' });
await page.locator('.shea-sidebar-topline').getByRole('button', { name: 'Close site navigation', exact: true }).click();
await visit('/skin');
const collection = page.locator('.department-product-carousel');
const productTitle = await collection.locator('h2').innerText();
await collection.getByRole('button', { name: 'Next product', exact: true }).click();
assert.notEqual(await collection.locator('h2').innerText(), productTitle);
await collection.getByRole('button', { name: 'Previous product', exact: true }).click();
assert.equal(await collection.locator('h2').innerText(), productTitle);
await visit('/shop');
await page.locator('.shop-card-photo').first().click();
await page.locator('[data-cart-ready="true"]').waitFor();
await page.getByRole('button', { name: /Add to cart/i }).first().waitFor();
await page.getByRole('button', { name: /Add to cart/i }).first().click();
await page.getByText(/added to cart\./).waitFor();
await visit('/shop?cart=open');
await page.locator('.commerce-drawer.open').waitFor({ state: 'visible' });
const checkoutButton = page.locator('.commerce-drawer.open').getByRole('button', { name: 'Checkout', exact: true });
console.log('Mobile cart opened with the selected product.');
await checkoutButton.click();
await page.getByLabel('Email', { exact: true }).fill('qa-smoke@example.invalid');
await page.getByLabel('Full name', { exact: true }).fill('QA Mobile');
await page.getByLabel('Phone number', { exact: true }).fill('0700000000');
await page.getByLabel('Address', { exact: true }).fill('Test address');
await page.getByLabel('City / county / province', { exact: true }).fill('Nairobi');
for (let index = 0; index < 3; index++) await page.getByRole('button', { name: 'Continue', exact: true }).click();
await page.getByRole('button', { name: 'Place order request', exact: true }).waitFor({ state: 'visible' });
assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
await page.screenshot({ path: 'artifacts/smoke/checkout-mobile.png' });
// Exercise review UI without submitting an extra order; persistence is covered by db-sanity.
await visit('/admin');
await page.locator('.shea-admin').waitFor({ state: 'visible' });
await page.locator('[data-admin-ready="true"]').waitFor();
assert.equal(await page.locator('input[type="password"]').count(), 0, 'Admin opens directly');
for (const label of ['Orders', 'Products', 'Media library', 'Site pages', 'Enquiries', 'Settings']) {
  console.log('Checking admin panel: ' + label);
  await page.screenshot({ path: 'artifacts/smoke/admin-mobile.png' });
  await page.locator('.shea-admin-sidebar').getByRole('button', { name: label, exact: true }).click();
  await page.waitForLoadState('networkidle');
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'Admin panel ' + label);
}
await page.screenshot({ path: 'artifacts/smoke/admin-mobile.png' });
await visit('/account');
await page.evaluate(() => ['sheaWellnessCart', 'sheaWellnessWishlist', 'sheaWellnessOrders', 'sheaWellnessReviews', 'sheaWellnessRecentlyViewed'].forEach(key => localStorage.setItem(key, 'bad-json')));
for (const route of ['/account', '/face', '/shop']) await visit(route);
assert.deepEqual(errors, []);
await browser.close();
console.log('PASS: current campaign state, collection controls, mobile menu, add-to-cart, checkout through review, all admin panels, and corrupted browser-storage recovery.');
