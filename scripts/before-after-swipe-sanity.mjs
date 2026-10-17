import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const base=process.argv[2]||'http://localhost:3152';
try {
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
 await page.locator('html[data-cms-hydrated="true"]').waitFor({state:'attached',timeout:120000});
 const rail=page.locator('.owner-progress .auto-rail-track');await rail.scrollIntoViewIfNeeded();
 const cdp=await page.context().newCDPSession(page);
 const initial=await rail.evaluate(node=>node.scrollLeft);
 const bounds=await rail.boundingBox(),y=Math.max(40,Math.min(750,bounds.y+120));
 async function swipe(from,to){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from,y}]});
  for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from+(to-from)*i/10,y}]});await new Promise(resolve=>setTimeout(resolve,20));}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 await swipe(320,70);await page.waitForFunction(start=>document.querySelector('.owner-progress .auto-rail-track').scrollLeft>start+80,initial);
 const after=await rail.evaluate(node=>node.scrollLeft);console.log('Touch swipe state',JSON.stringify({initial,after,bounds,y,controls:await page.locator('.owner-progress button').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')))}));await page.getByRole('button',{name:'Play before and after',exact:true}).waitFor({state:'visible'});
 await new Promise(resolve=>setTimeout(resolve,700));const settled=await rail.evaluate(node=>node.scrollLeft);assert.ok(settled>=after-2);
 await swipe(70,320);await page.waitForFunction(position=>document.querySelector('.owner-progress .auto-rail-track').scrollLeft<position-50,settled);
 await rail.focus();const beforeKey=await rail.evaluate(node=>node.scrollLeft);await page.keyboard.press('ArrowRight');await page.waitForFunction(position=>document.querySelector('.owner-progress .auto-rail-track').scrollLeft>position+30,beforeKey);
 await page.getByRole('button',{name:'Play before and after',exact:true}).click();
 await new Promise(resolve=>setTimeout(resolve,500));const resumed=await rail.evaluate(node=>node.scrollLeft);
 await page.waitForFunction(position=>document.querySelector('.owner-progress .auto-rail-track').scrollLeft>position+5,resumed,{timeout:5000});
 console.log('PASS native touch swipe both directions, manual pause, momentum, keyboard navigation and explicit play resume');
}catch(error){console.error(error);process.exitCode=1;}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);}process.exit(process.exitCode??0);
