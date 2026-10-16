import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.argv[2]||'http://localhost:3152';
const folder='artifacts/carousel-story-variations';await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
const style='header[data-testid="global-header"],.commerce-mobile-tabs,.shea-whatsapp-chat,.commerce-drawer {visibility:hidden!important}';
try {
 const page=await browser.newPage();page.setDefaultTimeout(90000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const width of (process.argv.includes('--variations')?[]:[320,390,768,1440])){
  await page.setViewportSize({width,height:1000});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('html[data-cms-hydrated="true"]').waitFor({state:'attached'});
  const carousel=page.locator('.product-film-carousel'),rail=carousel.locator('.product-film-rail');
  await carousel.scrollIntoViewIfNeeded();
  const geometry=await rail.evaluate(rail=>{const b=rail.getBoundingClientRect(),cards=[...rail.children].map(card=>card.getBoundingClientRect());return {total:cards.length,visible:cards.filter(card=>card.right>b.left+1&&card.left<b.right-1).length,full:cards.filter(card=>card.left>=b.left-1&&card.right<=b.right+1).length,overflow:document.documentElement.scrollWidth>innerWidth+1};});
  assert.ok(geometry.total>4);assert.equal(geometry.overflow,false);assert.ok(geometry.visible>=2);
  if(width===1440)assert.ok(geometry.full>=4);
  await page.waitForFunction(()=>[...document.querySelectorAll('.product-film-rail video')].some(v=>!v.paused&&v.currentTime>0),null,{timeout:90000});
  const playing=await rail.locator('video').evaluateAll(videos=>videos.filter(v=>!v.paused).map(v=>({muted:v.muted,loop:v.loop,inline:v.playsInline})));assert.ok(playing.length<=geometry.visible);assert.ok(playing.every(v=>v.muted&&v.loop&&v.inline));
  if(width===1440){await page.mouse.move(0,0);await page.waitForFunction(()=>document.querySelector('.product-film-rail').scrollLeft>30,null,{timeout:15000});await rail.evaluate(node=>node.scrollTo({left:0,behavior:'instant'}));console.log('PASS automatic carousel sliding');}
  await carousel.getByRole('button',{name:'Pause video carousel',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.product-film-rail video')].every(v=>v.paused));
  await carousel.getByRole('button',{name:'Next videos',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.product-film-rail').scrollLeft>30);
  await carousel.getByRole('button',{name:'Previous videos',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.product-film-rail').scrollLeft<2);
  await rail.focus();await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('.product-film-rail').scrollLeft>30);
  await carousel.screenshot({path:`${folder}/videos-${width}.png`,style});
  console.log('PASS video row, muted autoplay, pause, arrows and keyboard sliding',width,JSON.stringify(geometry));
  await page.goto(base+'/about',{waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('html[data-cms-hydrated="true"]').waitFor({state:'attached'});
  const photos=await page.locator('.shea-page-about img[data-image-slot]').evaluateAll(async images=>{images.forEach(img=>img.loading='eager');await Promise.all(images.map(img=>img.decode()));return images.map(img=>{const b=img.getBoundingClientRect();return {rendered:b.width/b.height,natural:img.naturalWidth/img.naturalHeight};});});
  assert.ok(photos.length===5&&photos.every(img=>Math.abs(img.rendered-img.natural)<.02));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.locator('.shea-page-hero').screenshot({path:`${folder}/story-hero-${width}.png`,style});
  await page.locator('.shea-story-opening').screenshot({path:`${folder}/story-opening-${width}.png`,style});
  await page.locator('.shea-complete-story > article').first().screenshot({path:`${folder}/story-card-${width}.png`,style});
  console.log('PASS Our Story layout and full photos',width);
 }
 const response=await fetch(base+'/api/storefront/content');assert.ok(response.ok);const {data}=await response.json();
 for(const id of ['prod_lavender','prod_essential_oils','prod_black_soap']){
  const product=data.products.find(p=>p.id===id);assert.ok(product);
  for(const width of [390,1440]){
   await page.setViewportSize({width,height:1000});await page.goto(base+'/products/'+id,{waitUntil:'domcontentloaded',timeout:120000});
   await page.locator('html[data-cms-hydrated="true"]').waitFor({state:'attached'});
   const options=page.locator('.shea-product-size');
   for(const [option,media] of Object.entries(product.sizeMedia??{})){
    if(!media.imageUrl)continue;
    console.log('Checking variation',id,width,option);
    const button=options.getByRole('button',{name:option,exact:true});await button.locator('img').waitFor({state:'attached'});assert.equal(await button.locator('img').count(),1);await button.click();
    const main=page.locator('.shea-product-main-image img');await page.waitForFunction(src=>document.querySelector('.shea-product-main-image img').getAttribute('src')===src,media.imageUrl);
    await main.evaluate(img=>img.decode());assert.equal(await main.evaluate(img=>getComputedStyle(img).objectFit),'contain');
   }
   await page.locator('.shea-product-detail-hero').screenshot({path:`${folder}/${id}-${width}.png`,style});console.log('PASS variation photos and selection',id,width);
  }
 }
 await page.goto(base+'/shop',{waitUntil:'domcontentloaded',timeout:120000});
 for(const id of ['prod_lavender','prod_essential_oils']){
  const product=data.products.find(p=>p.id===id),card=page.locator(`[data-product-id="${id}"]`).first();
  const [option,media]=Object.entries(product.sizeMedia).find(([,media])=>media.imageUrl);
  await card.scrollIntoViewIfNeeded();await card.getByRole('button',{name:product.sizes.length>3?'Choose '+option:option,exact:true}).click();
  assert.equal(await card.locator('.shop-card-photo img').getAttribute('src'),media.imageUrl);
  console.log('PASS shop card variation image',id);
 }
 assert.deepEqual(errors,[]);console.log('PASS all UI checks');
}catch(error){console.error(error);process.exitCode=1;}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);}
process.exit(process.exitCode??0);
