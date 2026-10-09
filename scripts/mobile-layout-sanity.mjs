import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const playwright = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.QA_BROWSER_ENGINE || 'chromium';
const browser = await playwright[engine].launch({ headless: true, executablePath: process.env.QA_BROWSER_PATH || undefined });
const base = process.env.SMOKE_URL || 'http://localhost:3140';
const directory = `artifacts/layout-${engine}`;
await mkdir(directory, { recursive: true });
const results = [];
try {
  for (const width of [320, 390, 430, 600, 768, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 768, hasTouch: width < 768 });
    const page = await context.newPage();
    page.setDefaultTimeout(90000);
    page.setDefaultNavigationTimeout(90000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['/', '/shop', '/face', '/contact', '/wellness-guides', '/catalogue', '/products/prod_vanilla_mint']) {
      const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200);
      await page.locator('[data-cart-ready="true"]').waitFor();
      const header = page.getByTestId('global-header');
      const spacer = page.getByTestId('header-spacer');
      const headerBox = await header.boundingBox();
      assert.equal(await header.evaluate(element => getComputedStyle(element).position), 'fixed');
      await page.waitForFunction(() => {
        const header = document.querySelector('[data-testid="global-header"]');
        const spacer = document.querySelector('[data-testid="header-spacer"]');
        return Math.abs(header.getBoundingClientRect().height - spacer.getBoundingClientRect().height) < 1;
      });
      assert.ok(Math.abs((await spacer.boundingBox()).height - headerBox.height) < 1, 'Header space must match its height');
      const mainBox = await page.locator('main').boundingBox();
      assert.ok(mainBox.y >= headerBox.height - 1, `${route} content obscured by header`);
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }));
      await page.waitForFunction(() => scrollY > 100);
      assert.ok(Math.abs((await header.boundingBox()).y) < 1, `${route} navbar moved when scrolling`);
      if (route === '/') {
        const cards = page.locator('.commerce-concern-grid > a');
        assert.equal(await cards.count(), 6);
        const cardMetrics = await cards.evaluateAll(elements => elements.map(element => {
          const box = element.getBoundingClientRect();
          return { width: box.width, x: box.x, right: box.right, clipped: [...element.querySelectorAll('strong, span, b')].some(child => child.scrollWidth > child.clientWidth + 1 || child.getBoundingClientRect().right > box.right + 1) };
        }));
        assert.ok(cardMetrics.every(card => card.width >= 180 && card.x >= 0 && card.right <= width + 1 && !card.clipped), `Squeezed or clipped routine cards: ${JSON.stringify(cardMetrics)}`);
        const grid = await page.locator('.commerce-concern-grid').evaluate(element => ({ width: element.clientWidth, scrollWidth: element.scrollWidth, autoFlow: getComputedStyle(element).gridAutoFlow }));
        assert.equal(grid.autoFlow, 'row');
        assert.ok(grid.scrollWidth <= grid.width + 1, 'Routine grid must not scroll sideways');
        if ([390, 768, 1440].includes(width)) {
          await page.locator('#skin-concerns').scrollIntoViewIfNeeded();
          await page.screenshot({ path: `${directory}/routines-${width}.png`, animations: 'disabled' });
        }
      }
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      // Safari scroll anchoring and newly visible lazy images settle on the next frames.
      await page.waitForFunction(() => {
        scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'});
        return document.documentElement.scrollHeight - innerHeight - scrollY < 2;
      });
      const footerGap = await page.locator('.shea-commerce-footer').evaluate(element => document.documentElement.scrollHeight - (element.getBoundingClientRect().bottom + scrollY));
      assert.ok(footerGap <= 2, `${route}: ${footerGap}px empty space after footer`);
      const chat = page.locator('.shea-whatsapp-chat');
      assert.equal(await chat.evaluate(element => getComputedStyle(element).position), 'fixed');
      const chatBox = await chat.boundingBox();
      assert.ok(chatBox.x + chatBox.width <= width + 1 && chatBox.x >= 0, 'WhatsApp button outside viewport');
      if (width <= 640) {
        const tabsBox = await page.locator('.commerce-mobile-tabs').boundingBox();
        assert.ok(chatBox.y + chatBox.height <= tabsBox.y - 4, 'WhatsApp button overlaps mobile navigation');
        const copyrightBox = await page.locator('.shea-commerce-footer-bottom').boundingBox();
        assert.ok(copyrightBox.y < tabsBox.y, 'Footer copyright hidden by bottom navigation');
        const copyrightLines = await page.locator('.shea-commerce-footer-bottom > span').evaluateAll(elements => elements.map(element => { const box=element.getBoundingClientRect();return {x:box.x,right:box.right,y:box.y,bottom:box.bottom}; }));
        assert.ok(copyrightLines.every(line => line.right <= chatBox.x || line.bottom <= chatBox.y || line.y >= chatBox.y + chatBox.height), 'WhatsApp button covers footer text');
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} horizontal overflow`);
      assert.deepEqual(errors, [], `${route} browser errors`);
      if (route === '/' && [390, 768, 1440].includes(width)) await page.screenshot({ path: `${directory}/footer-${width}.png`, animations: 'disabled' });
      await header.getByRole('button', { name: 'Search Shea Wellness', exact: true }).click();
      assert.ok(await page.getByRole('textbox', { name: 'Search products, pages, wholesale, quality' }).isVisible(), 'Fixed-header search unavailable after scroll');
      await page.getByRole('button', { name: 'Close search', exact: true }).click();
      await header.getByRole('button', { name: 'Open navigation', exact: true }).click();
      const sidebar = page.locator('.shea-desktop-sidebar.open');
      await sidebar.waitFor({ state: 'visible' });
      await sidebar.getByRole('button', { name: 'Close site navigation', exact: true }).click();
      await sidebar.waitFor({ state: 'hidden' });
      results.push({ route, width, fixedHeaderHeight: headerBox.height, footerGap });
      console.log(`PASS ${engine} ${width} ${route}: fixed navbar, fitted cards, footer and floating chat`);
    }
    // Resizing across breakpoints must also update the reserved header space.
    await page.setViewportSize({ width: width < 768 ? 1024 : 390, height: 844 });
    await page.waitForFunction(() => Math.abs(document.querySelector('[data-testid="global-header"]').getBoundingClientRect().height - document.querySelector('[data-testid="header-spacer"]').getBoundingClientRect().height) < 1);
    await context.close();
  }
  await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2));
  console.log(`PASS ${results.length} ${engine} layout checks.`);
} finally { await browser.close(); }
