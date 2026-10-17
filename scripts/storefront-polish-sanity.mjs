import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.argv.find(arg=>/^https?:/.test(arg))||'http://localhost:3152';
const folder='artifacts/storefront-polish';await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
const routes=['/','/shop','/products','/face','/skin','/hair','/spa-essentials','/wellness-gifts','/about','/wholesale','/sustainability','/quality','/blog','/contact','/catalogue','/wellness-guides','/faq','/policies','/shipping-policy','/refund-policy','/account','/collections/skin-care','/products/prod_lavender'];
const results=[],errors=[];
const style='header[data-testid="global-header"],.commerce-mobile-tabs,.shea-whatsapp-chat,.commerce-drawer,nextjs-portal {visibility:hidden!important}';
try {
 const page=await browser.newPage({reducedMotion:'reduce'});page.setDefaultTimeout(90000);page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*.mp4',route=>route.abort());
 if(!process.argv.includes('--flows'))for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  for(const route of routes){
   const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:120000});assert.ok(response.status()<400,`${route}: ${response.status()}`);
   await page.locator('main').first().waitFor({state:'visible'});
   const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,over:[...document.querySelectorAll('main *')].filter(n=>{const b=n.getBoundingClientRect();return b.width>0&&(b.left< -2||b.right>innerWidth+2)&&!n.closest('.auto-rail-track,.product-film-rail,.commerce-concern-grid,.shea-video-slider,.commerce-video-slider,.department-carousel-stage,.commerce-drawer');}).slice(0,5).map(n=>n.className)}));
   results.push({width,route,...layout});assert.ok(layout.scroll<=width+1,`${route} ${width}: horizontal overflow ${JSON.stringify(layout)}`);
   if(width===390&&['/shop','/face','/contact','/faq','/account','/wellness-guides','/policies'].includes(route))await page.screenshot({path:`${folder}/${route.slice(1)}-${width}.png`,style});
   console.log('PASS page',width,route);
  }
 }
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:850});await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  const trigger=page.locator('.beauty-routine-banner > a');await trigger.click();
  const finder=page.getByRole('dialog',{name:'What would you like to care for?',exact:true});await finder.waitFor({state:'visible'});
  assert.equal(await finder.locator('.routine-finder-choices a').count(),6);
  await finder.screenshot({path:`${folder}/routine-finder-${width}.png`});
  await page.keyboard.press('Escape');await finder.waitFor({state:'hidden'});assert.equal(await trigger.evaluate(n=>n===document.activeElement),true);
  await trigger.click();await finder.getByRole('link',{name:'Dry or flaky skin',exact:false}).click({noWaitAfter:true});await page.waitForURL('**/wellness-guides#dry-flaky-skin',{waitUntil:'domcontentloaded',timeout:120000});await page.locator('#dry-flaky-skin').waitFor({state:'visible'});
  console.log('PASS routine finder, matching guide link and focus restore',width);
  await page.goto(base+'/shop',{waitUntil:'domcontentloaded',timeout:120000});
  if(width<=520){const columns=await page.locator('.commerce-product-grid').first().evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length);assert.equal(columns,1);}
  const card=page.locator('[data-product-id="prod_lavender"]').first();await card.getByRole('button',{name:'200ml',exact:true}).click();await card.getByRole('button',{name:'Add to bag',exact:true}).click();
  const drawer=page.locator('.commerce-drawer.open');await drawer.getByRole('button',{name:'Checkout',exact:true}).click();
  const checkout=page.getByRole('dialog',{name:'Checkout',exact:true});await checkout.waitFor({state:'visible'});
  assert.equal(await checkout.locator('.commerce-checkout-steps button').count(),3);assert.equal(await checkout.getByRole('button',{name:'Choose delivery',exact:true}).isEnabled(),false);
  for(const [label,value] of [['Email','ui-check@example.invalid'],['Full name','UI Check'],['Phone number','0700000000'],['Address','Test address 123'],['City / county / province','Nairobi']])await checkout.getByLabel(label,{exact:true}).fill(value);
  await checkout.getByRole('button',{name:'Choose delivery',exact:true}).click();
  await checkout.getByRole('button',{name:'Review order',exact:true}).click();
  assert.ok((await checkout.innerText()).includes('5287597'));assert.equal(await checkout.getByRole('button',{name:'Place order',exact:true}).isEnabled(),true);
  await checkout.getByRole('button',{name:'Edit details',exact:true}).click();assert.equal(await checkout.getByLabel('Full name',{exact:true}).inputValue(),'UI Check');
  await checkout.getByRole('button',{name:'Choose delivery',exact:true}).click();await checkout.getByRole('button',{name:'Review order',exact:true}).click();
  const bounds=await checkout.boundingBox();assert.ok(bounds.width<=width&&bounds.height<=850);
  await checkout.screenshot({path:`${folder}/checkout-review-${width}.png`});
  await checkout.getByRole('button',{name:'Close checkout',exact:true}).click();
  console.log('PASS roomier product cards, three-step checkout, retained details, Till preview',width);
 }
 // Exercise success presentation against an explicit intercepted response, without writing a real order.
 await page.goto(base+'/shop?cart=open',{waitUntil:'domcontentloaded',timeout:120000});
 await page.locator('.commerce-drawer.open').getByRole('button',{name:'Checkout',exact:true}).click();
 const checkout=page.getByRole('dialog',{name:'Checkout',exact:true});
 for(const [label,value] of [['Email','ui-check@example.invalid'],['Full name','UI Check'],['Phone number','0700000000'],['Address','Test address 123'],['City / county / province','Nairobi']])await checkout.getByLabel(label,{exact:true}).fill(value);
 await checkout.getByRole('button',{name:'Choose delivery',exact:true}).click();await checkout.getByRole('button',{name:'Review order',exact:true}).click();
 let attempts=0,requestId;
 await page.route('**/api/storefront/checkout',async route=>{const request=route.request().postDataJSON();assert.equal(request.customer.paymentMethod,'mpesa');if(!attempts++){requestId=request.requestId;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Please try again shortly.'})});return;}assert.equal(request.requestId,requestId);await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({data:{orderNumber:'UI-TEST-ONLY',itemCount:1,items:[],total:1500,paymentStatus:'pending',fulfillmentStatus:'unfulfilled',placedAt:new Date().toISOString()}})});});
 await checkout.getByRole('button',{name:'Place order',exact:true}).click();await checkout.getByRole('alert').waitFor({state:'visible'});assert.equal(await checkout.getByRole('alert').innerText(),'Please try again shortly.');
 await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='sheaWellnessOrders')throw new Error('Storage unavailable for test');return original.call(this,key,value);};});
 await checkout.getByRole('button',{name:'Place order',exact:true}).click();
 await checkout.getByText('UI-TEST-ONLY',{exact:true}).waitFor({state:'visible'});assert.ok((await checkout.innerText()).includes('5287597'));assert.ok((await checkout.innerText()).includes('payment pending'));assert.equal(await checkout.locator('.commerce-checkout-summary').count(),0);
 await checkout.screenshot({path:`${folder}/checkout-success-fixture.png`});
 console.log('PASS error retry, stable request ID, browser storage failure and success UI with pending Till payment (intercepted responses)');
 assert.deepEqual(errors,[]);await fs.writeFile(folder+'/results.json',JSON.stringify({results,errors},null,2));console.log('PASS storefront polish checks');
}catch(error){console.error(error);await fs.writeFile(folder+'/results.json',JSON.stringify({results,errors,error:error.message},null,2));process.exitCode=1;}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);}process.exit(process.exitCode??0);
