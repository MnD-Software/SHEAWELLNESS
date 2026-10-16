import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.SMOKE_URL||'http://localhost:3152';
const folder='artifacts/image-frames';
await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
const results=[];
try {
 const page=await browser.newPage();page.setDefaultTimeout(90000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  const grid=page.locator('.commerce-concern-grid');await grid.waitFor({state:'visible'});
  await grid.locator('img').evaluateAll(async images=>{images.forEach(image=>image.loading='eager');await Promise.all(images.map(image=>image.decode()));});
  const state=await grid.evaluate(grid=>({
   columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
   cards:[...grid.querySelectorAll(':scope > a')].map(card=>{const image=card.querySelector('img'),bounds=card.getBoundingClientRect(),photo=image.getBoundingClientRect();return {x:bounds.x,y:bounds.y,fit:getComputedStyle(image).objectFit,margin:getComputedStyle(image).margin,gaps:[photo.left-bounds.left,photo.top-bounds.top,bounds.right-photo.right,bounds.bottom-photo.bottom],fade:getComputedStyle(card.querySelector('i')).display,overflow:card.scrollWidth>card.clientWidth+1};}),
   overflow:document.documentElement.scrollWidth>innerWidth+1
  }));
  assert.equal(state.columns,3,`${width}: three columns`);assert.equal(state.cards.length,6);
  assert.equal(new Set(state.cards.map(card=>Math.round(card.y))).size,2,`${width}: two rows`);
  assert.equal(state.overflow,false,`${width}: no horizontal overflow`);
  for(const card of state.cards){assert.equal(card.fit,'cover');assert.equal(card.margin,'0px');assert.equal(card.fade,'none');assert.equal(card.overflow,false);assert.ok(card.gaps.every(gap=>Math.abs(gap)<=2),`${width}: photo fills frame ${card.gaps}`);}
  await grid.screenshot({path:`${folder}/routines-${width}.png`});
  results.push({width,route:'/',...state});console.log('PASS routine grid',width,'three columns, two rows, full photos, no fade');
 }
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  for(const route of ['/shop','/skin','/about','/wellness-guides','/wellness-gifts','/products/prod_rosehip_facial_oil','/catalogue']){
   await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:120000});await page.locator('main').waitFor({state:'visible'});
   const state=await page.evaluate(()=>({
    photos:[...document.querySelectorAll('main img[data-image-slot][src]:not(.owner-partner-grid img, .owner-resources img, .shea-partners-section img, .commerce-partners img)')].map(img=>({src:img.getAttribute('src'),fit:getComputedStyle(img).objectFit,fullPhoto:!!img.closest('.shea-page-about,.shea-product-main-image,.shea-product-thumbs,.shea-product-size,.shop-card-options')})),
    overflow:document.documentElement.scrollWidth>innerWidth+1,
    logoFits:[...document.querySelectorAll('img[data-brand-logo]')].map(img=>getComputedStyle(img).objectFit),
    previews:[...document.querySelectorAll('.owner-partner-grid img,.owner-resources img')].map(img=>getComputedStyle(img).objectFit)
   }));
   assert.equal(state.overflow,false,`${width} ${route}: overflow`);
   assert.ok(state.photos.every(img=>img.fit===(img.fullPhoto?'contain':'cover')),`${width} ${route}: photographs use the intended fit`);
   assert.ok(state.previews.every(fit=>fit==='contain'),`${route}: full partner marks and document previews`);
   if(route==='/about'){
    const storyPhotos=page.locator('.shea-page-about img[data-image-slot]');
    const proportions=await storyPhotos.evaluateAll(async images=>{images.forEach(image=>image.loading='eager');await Promise.all(images.map(image=>image.decode()));return images.map(image=>{const bounds=image.getBoundingClientRect();let clipped=false;for(let parent=image.parentElement;parent&&!parent.matches('main');parent=parent.parentElement){const style=getComputedStyle(parent),frame=parent.getBoundingClientRect();if(['hidden','clip'].includes(style.overflowY)&&(bounds.top<frame.top-2||bounds.bottom>frame.bottom+2))clipped=true;}return {rendered:bounds.width/bounds.height,natural:image.naturalWidth/image.naturalHeight,clipped};});});
    assert.ok(proportions.every(image=>Math.abs(image.rendered-image.natural)<.02),`${width}: full Story photos retain their native proportions`);
    assert.ok(proportions.every(image=>!image.clipped),`${width}: Story frames do not clip the photos`);
    const style='header[data-testid="global-header"],.commerce-mobile-tabs,.shea-whatsapp-chat,.commerce-drawer { visibility: hidden !important; }';
    await page.locator('.shea-page-hero').screenshot({path:`${folder}/story-hero-${width}.png`,style});
    await page.locator('.shea-story-opening-visual').screenshot({path:`${folder}/story-founder-${width}.png`,style});
    await page.locator('.shea-complete-story > article').first().screenshot({path:`${folder}/story-card-${width}.png`,style});
   }
   results.push({width,route,...state});console.log('PASS photo frames',width,route,state.photos.length);
  }
 }
 assert.deepEqual(errors,[]);await fs.writeFile(folder+'/results.json',JSON.stringify({results,errors},null,2));
}finally{await browser.close();}
