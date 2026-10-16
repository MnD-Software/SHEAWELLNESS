import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const base = process.env.SMOKE_URL || 'http://localhost:3152';
const out = 'artifacts/client-revisions';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(90000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const response = await page.request.get(base + '/api/storefront/content', { timeout: 120000 });
const content = (await response.json()).data;
await fs.writeFile(out + '/content-before.json', JSON.stringify(content, null, 2));
console.log('Loaded saved content:',content.persisted,content.products.length,'products');
const results = [];
for (const width of [390, 1440]) {
 await page.setViewportSize({width,height:1000});
 for (const route of ['/', '/about', '/skin', '/wellness-gifts', '/wellness-guides', '/catalogue']) {
  await page.goto(base+route, {waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('main').waitFor({state:'visible'});
  await page.evaluate(async()=> { const images=[...document.images].filter(x=>x.getAttribute('src')); images.forEach(x=>x.loading='eager'); await Promise.race([Promise.all(images.map(x=>x.decode().catch(()=>{}))),new Promise(resolve=>setTimeout(resolve,30000))]); });
  const state = await page.evaluate(()=>({
   title:document.querySelector('main h1')?.textContent,
   overflow:document.documentElement.scrollWidth>innerWidth+1,
   broken:[...document.querySelectorAll('main img[src]')].filter(x=>!x.complete || !x.naturalWidth).map(x=>x.src),
   contacts:document.querySelector('.shea-footer-contacts')?.textContent,
   images:[...document.querySelectorAll('main img')].map(x=>({src:x.getAttribute('src'),fit:getComputedStyle(x).objectFit})),
   hero:document.querySelector('.shea-page-hero')?.getBoundingClientRect().height,
  }));
  await page.screenshot({path:`${out}/${route.replaceAll('/','')||'home'}-${width}.png`,fullPage:true});
  results.push({width,route,...state});
  console.log('CHECK',width,route,'overflow='+state.overflow,'broken='+state.broken.length);
 }
}
await fs.writeFile(out+'/review.json', JSON.stringify({results,errors},null,2));
console.log('PAGE_ERRORS',JSON.stringify(errors));
await browser.close();
