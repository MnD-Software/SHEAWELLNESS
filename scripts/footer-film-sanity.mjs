import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.SMOKE_URL||process.argv[2]||'http://localhost:3152';
const browser=await chromium.launch({headless:true,channel:'msedge'});
await fs.mkdir('artifacts/footer-films',{recursive:true});
try {
 const page=await browser.newPage();page.setDefaultTimeout(90000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  const footer=page.locator('.shea-commerce-footer');await footer.waitFor({state:'visible'});
  const state=await footer.evaluate(footer=>{const logo=footer.querySelector('.shea-footer-logo').getBoundingClientRect(),grid=footer.querySelector('.shea-commerce-footer-grid').getBoundingClientRect(),contacts=footer.querySelector('.shea-footer-contacts').getBoundingClientRect();return {logo:{width:logo.width,height:logo.height},gridLeft:grid.left,contactsLeft:contacts.left,gridRight:grid.right,contactsRight:contacts.right,overflow:document.documentElement.scrollWidth>innerWidth+1};});
  assert.equal(state.logo.width,88);assert.equal(state.logo.height,132);assert.equal(state.overflow,false);
  assert.ok(Math.abs(state.gridLeft-state.contactsLeft)<2);assert.ok(Math.abs(state.gridRight-state.contactsRight)<2);
  await footer.screenshot({path:`artifacts/footer-films/footer-${width}.png`,style:'header[data-testid="global-header"],.commerce-mobile-tabs,.shea-whatsapp-chat,.commerce-drawer { visibility: hidden !important; }'});
  console.log('PASS footer sizing and alignment',width);
 }
 const carousel=page.locator('.product-film-slideshow').first(),video=carousel.locator('video');
 await carousel.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{const v=document.querySelector('.product-film-slideshow video');return v&&!v.paused&&v.currentTime>0;},null,{timeout:90000});
 assert.equal(await video.evaluate(v=>v.muted&&v.playsInline&&v.autoplay),true);
 await carousel.getByRole('button',{name:'Pause product slideshow',exact:true}).click();
 assert.equal(await video.evaluate(v=>v.paused),true);
 await carousel.getByRole('button',{name:'Play product slideshow',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('.product-film-slideshow video').paused);
 const source=await video.getAttribute('src');
 await video.evaluate(v=>{v.currentTime=v.duration-.15;});
 await page.waitForFunction(src=>document.querySelector('.product-film-slideshow video').getAttribute('src')!==src,source,{timeout:90000});
 await page.waitForFunction(()=>{const v=document.querySelector('.product-film-slideshow video');return !v.paused&&v.currentTime>0;});
 console.log('PASS muted inline autoplay, pause, resume and advance on actual clip end');
 await carousel.getByRole('button',{name:'Previous product film',exact:true}).click();
 assert.equal(await video.getAttribute('src'),source);
 await carousel.getByRole('button',{name:'Previous product film',exact:true}).click();
 const count=await carousel.locator('.product-film-controls > span').innerText();
 const [current,total]=count.split('/').map(Number);assert.equal(current,total);
 await carousel.getByRole('button',{name:'Next product film',exact:true}).click();assert.equal(await video.getAttribute('src'),source);
 console.log('PASS carousel navigation and wrapping');assert.deepEqual(errors,[]);
}finally{await browser.close();}
