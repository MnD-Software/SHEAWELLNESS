import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.SMOKE_URL||'http://localhost:3152';
const out='artifacts/client-revisions';
const browser=await chromium.launch({headless:true,channel:'msedge'});
process.on('uncaughtException',async error=>{console.error(error);await browser.close();process.exitCode=1;});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(90000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let contentRequests=0;
await page.route('**/api/storefront/content',route=>{contentRequests++;return route.abort();});
const saved=(await (await page.request.get(base+'/api/admin/content')).json()).data;
assert.equal(saved.persisted,true);
assert.equal(saved.products.find(p=>p.id==='prod_soothing_body_oil').status,'draft');
for(const id of ['prod_rosehip_facial_oil','prod_yellow_castor_oil','prod_cucumber_mint_sunscreen','prod_baobab_oil','prod_soothing_body_oil'])assert.ok(saved.products.find(p=>p.id===id)?.details?.length>0,id);
const checks=[];
for(const width of [390,1440]) {
 await page.setViewportSize({width,height:1000});
 for(const route of process.argv.includes('--remaining') ? ['/shop','/products/prod_rosehip_facial_oil','/products/prod_yellow_castor_oil'] : ['/','/about','/shop','/products/prod_rosehip_facial_oil','/products/prod_yellow_castor_oil']) {
  await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('main').waitFor({state:'visible'});
  await page.evaluate(()=>{document.querySelectorAll('main img[src]').forEach(i=>i.loading='eager');});
  await page.waitForFunction(()=>[...document.querySelectorAll('main img[src]')].every(i=>i.complete&&i.naturalWidth>0),{},{timeout:90000});
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.querySelectorAll('main img[src]')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),heading:document.querySelector('main h1')?.textContent,contacts:document.querySelector('.shea-footer-contacts')?.textContent}));
  assert.equal(state.overflow,false,`${width} ${route} overflow`);assert.deepEqual(state.broken,[],`${width} ${route} broken images`);assert.ok(state.contacts?.includes('sheabutterwellness@gmail.com'));
  if(route==='/') {
   const video=page.locator('.product-film-stage video');assert.match(await video.getAttribute('src'),/owner-film-01/);
   await video.evaluate(v=>v.dispatchEvent(new Event('ended')));await page.waitForFunction(()=>document.querySelector('.product-film-stage video')?.getAttribute('src')?.includes('owner-film-02'));
   await page.getByRole('button',{name:'Pause product slideshow',exact:true}).click();
   await video.evaluate(v=>v.dispatchEvent(new Event('ended')));assert.match(await video.getAttribute('src'),/owner-film-02/);
   await page.locator('.product-film-slideshow').screenshot({path:`${out}/films-${width}.png`});
  }
  if(route==='/about') {
   const image=page.locator('.shea-page-hero img');assert.equal(await image.getAttribute('src'),saved.pageOverrides['/about'].images['0']);
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('main').waitFor({state:'visible'});assert.equal(await image.getAttribute('src'),saved.pageOverrides['/about'].images['0']);
   await page.locator('.shea-story-opening').screenshot({path:`${out}/story-final-${width}.png`});
  }
  if(route==='/shop') {
   const card=page.locator('.shop-product-card').first();await card.scrollIntoViewIfNeeded();
   const styles=await card.evaluate(c=>({card:getComputedStyle(c).backgroundColor,photo:getComputedStyle(c.querySelector('.shop-card-photo')).backgroundColor,padding:getComputedStyle(c.querySelector('.shop-card-photo img')).padding}));
   assert.equal(styles.card,styles.photo);assert.equal(styles.padding,'0px');
   await card.evaluate(c=>{c.scrollIntoView({block:'start'});window.scrollBy(0,-220);});
   await card.screenshot({path:`${out}/cards-final-${width}.png`});
  }
  if(route.startsWith('/products/')) {
   assert.ok(await page.locator('.botanical-product-guide details').count()>0);
   await page.locator('.botanical-product-guide details').first().locator('summary').click();
   assert.equal(await page.locator('.botanical-product-guide details').first().getAttribute('open'),'');
   if(route.endsWith('prod_rosehip_facial_oil'))await page.locator('.shea-product-detail-hero').screenshot({path:`${out}/rosehip-final-${width}.png`});
  }
  checks.push({width,route,...state});console.log('PASS',width,route);
 }
}
assert.equal(contentRequests,0,'First render and refresh must not need a follow-up content request');
assert.deepEqual(errors,[]);
await fs.writeFile(out+'/final-checks.json',JSON.stringify({checks,contentRequests,errors},null,2));
await browser.close();console.log('PASS saved first-render content, refresh, films, cards, guides and contacts.');
