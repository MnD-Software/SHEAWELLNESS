import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_PATH || undefined});
const base = process.env.SMOKE_URL || 'http://localhost:3140';
const specification = JSON.parse(await readFile(new URL('./owner-content-2026-10-09.json',import.meta.url),'utf8'));
await mkdir('artifacts/owner-media',{recursive:true});
const results=[];
try {
  const response=await fetch(base+'/api/storefront/content');
  assert.equal(response.status,200);
  const {data}=await response.json();
  assert.equal(data.persisted,true);
  assert.equal(data.media.heroSlides.filter(item=>item.id.startsWith('owner_oct_')).length,3);
  for (const update of specification.updates) {
    const product=data.products.find(item=>item.id===update.id);assert.ok(product,update.id);
    if (update.price!==undefined) assert.equal(product.price,update.price,update.id+' price');
    if (update.imageUrl) assert.equal(product.imageUrl,update.imageUrl,update.id+' primary image');
    for (const [size,option] of Object.entries(update.sizeMedia || {})) {
      for (const [field,value] of Object.entries(option)) assert.equal(product.sizeMedia?.[size]?.[field] || '',value,update.id+' '+size+' '+field);
    }
  }
  assert.equal(data.products.find(item=>item.id==='prod_gift_set').status,'draft');
  assert.equal(data.products.find(item=>item.id==='prod_vitamin_oil_pending').status,'draft');
  const mediaPaths=[...specification.images,...specification.videos].map(item=>item.src);
  for (const src of mediaPaths) {
    const resource=await fetch(base+src,{headers:{Range:'bytes=0-31'}});
    assert.ok([200,206].includes(resource.status),src+' missing');
    const bytes=Buffer.from(await resource.arrayBuffer());
    if (src.endsWith('.mp4')) assert.equal(bytes.subarray(4,8).toString(),'ftyp',src+' invalid MP4');
    results.push({src,status:resource.status});
  }
  for (const filename of ['cosmetics-flyer.pdf','wellness-brochure.pdf']) {
    const resource=await fetch(base+'/assets/owner-oct-2026/'+filename);
    assert.equal(resource.status,200);
    const bytes=Buffer.from(await resource.arrayBuffer());assert.equal(bytes.subarray(0,4).toString(),'%PDF');
    results.push({src:filename,status:resource.status});
  }
  console.log(`PASS ${results.length} supplied images, MP4 resources and PDF downloads.`);
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.setDefaultTimeout(90000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/catalogue',{waitUntil:'domcontentloaded',timeout:90000});
  assert.equal(await page.locator('.owner-resources a[download]').count(),2);
  assert.equal(await page.locator('.owner-films video').count(),18);
  assert.equal(await page.locator('.owner-films video[autoplay]').count(),0,'Films should play on demand');
  const film=page.locator('.owner-films video').first();
  assert.ok(await film.evaluate(video=>video.canPlayType('video/mp4; codecs="avc1.42E01E"')), 'This test browser has no H.264 codec. Set QA_BROWSER_PATH to installed Chrome or Edge for the MP4 playback check.');
  await film.evaluate(video=>new Promise((resolve,reject)=>{video.addEventListener('loadedmetadata',resolve,{once:true});video.addEventListener('error',()=>reject(new Error('Video failed to load')),{once:true});video.preload='metadata';video.load();}));
  assert.ok(await film.evaluate(video=>video.videoWidth>0 && video.duration>0));
  console.log('PASS real MP4 playback metadata.');
  await page.screenshot({path:'artifacts/owner-media/catalogue-mobile.png',animations:'disabled'});
  await page.goto(base+'/wholesale',{waitUntil:'domcontentloaded'});
  const logos=page.locator('.owner-partner-grid img[src]');assert.equal(await logos.count(),29);
  await logos.evaluateAll(async images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode();})));
  assert.ok(await logos.evaluateAll(images=>images.every(image=>image.naturalWidth>0)));
  await page.goto(base+'/products/prod_vanilla_mint',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'200ml',exact:true}).click();
  assert.ok((await page.locator('.shea-product-main-image img').getAttribute('src')).includes('vanilla-mint-200.webp'));
  assert.equal(await page.locator('.shea-product-price').innerText(),'KSh 1,100');
  await page.getByRole('button',{name:'330ml',exact:true}).click();
  assert.ok((await page.locator('.shea-product-main-image img').getAttribute('src')).includes('vanilla-mint-330.webp'));
  assert.equal(await page.locator('.shea-product-price').innerText(),'KSh 1,500');
  await page.goto(base+'/products/prod_mosquito_repellents',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Unavailable online',exact:true}).first().waitFor();
  assert.equal(await page.getByRole('button',{name:'Unavailable online',exact:true}).first().isDisabled(),true);
  assert.ok(await page.getByRole('link',{name:'Ask about availability',exact:true}).isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  const rejected=await fetch(base+'/api/storefront/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId:crypto.randomUUID(),customer:{email:'qa-owner@example.invalid',fullName:'Owner media QA',phone:'0700000000',address:'QA only',country:'Kenya',city:'Nairobi',deliveryMethod:'kenya',paymentMethod:'mpesa'},items:[{productId:'prod_mosquito_repellents',size:'Lemongrass 120ml',quantity:1,unitPrice:1}],totals:{total:1}})});
  assert.equal(rejected.status,422,'Unavailable stock must be rejected by checkout');
  assert.match((await rejected.json()).error,/does not have enough stock/,'Checkout must reject the stock count specifically');
  await writeFile('artifacts/owner-media/results.json',JSON.stringify({resources:results.length,results,logos:29,films:18,variantPrices:true,unavailableStockRejected:true},null,2));
  console.log(`PASS ${results.length} supplied resource checks, 29 logos, 18 films, actual playback metadata, variant photos/prices, unpublished pending items, and stock protection.`);
} finally {await browser.close();}
