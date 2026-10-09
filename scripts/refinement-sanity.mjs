import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { zipSync } from 'fflate';
const {chromium} = await import(process.env.QA_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({headless:true, executablePath:process.env.QA_BROWSER_PATH || undefined});
const base = process.env.SMOKE_URL || 'http://localhost:3140';
const content = (await (await fetch(base + '/api/storefront/content')).json()).data;
const specification = JSON.parse(await readFile(new URL('./owner-zips-2026-10-09.json', import.meta.url), 'utf8'));
await mkdir('artifacts/refinements', {recursive:true});
const results = [];
try {
  for (const width of [320,390,768,1440]) {
    const context = await browser.newContext({viewport:{width,height:900}, reducedMotion:'reduce'});
    const page = await context.newPage(); page.setDefaultTimeout(60000);
    const errors=[]; page.on('pageerror', error=>errors.push(error.message));
    await page.goto(base,{waitUntil:'domcontentloaded'}); await page.locator('[data-cart-ready=true]').waitFor();
    const campaign = page.getByTestId('campaign-stage');
    const photo = campaign.locator('img'); await photo.evaluate(img=>img.decode());
    assert.equal(await photo.evaluate(img=>getComputedStyle(img).objectFit),'cover');
    assert.ok((await page.locator('[data-live-content]').boundingBox()).height <= (width<768 ? 420 : 420),'Compact homepage carousel');
    await page.locator('.commerce-concern-grid').scrollIntoViewIfNeeded();
    await page.locator('.commerce-concern-grid img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
    const columns = await page.locator('.commerce-concern-grid').evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    assert.equal(columns,width<768?1:width<1100?2:3);
    await page.screenshot({path:`artifacts/refinements/routines-${width}.png`,animations:'disabled'});
    await page.goto(base+'/shop',{waitUntil:'domcontentloaded'}); await page.locator('[data-cart-ready=true]').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Shop must fit the viewport');
    const lavender=page.locator('[data-product-id=prod_lavender]');
    assert.match(await lavender.locator('.shop-card-price').innerText(),/From.*1,100/);
    await lavender.getByRole('button',{name:'330ml',exact:true}).click();
    assert.equal(await lavender.locator('.shop-card-price').innerText(),'KSh 1,500');
    assert.match(await lavender.locator('.shop-card-photo img').getAttribute('src'),/lavender-330/);
    await lavender.getByRole('button',{name:'200ml',exact:true}).click();
    assert.equal(await lavender.locator('.shop-card-price').innerText(),'KSh 1,100');
    if(width<768){
      const cards=page.locator('.commerce-product-grid > article');
      const boxes=await cards.evaluateAll(items=>items.slice(0,2).map(item=>({x:item.getBoundingClientRect().x,y:item.getBoundingClientRect().y,width:item.getBoundingClientRect().width})));
      assert.ok(Math.abs(boxes[0].y-boxes[1].y)<=4,'Two products per mobile row, allowing the hover lift');
      assert.ok(boxes.every(box=>box.width>=130));
      assert.ok((await cards.first().boundingBox()).y + await page.evaluate(()=>scrollY) < 650,'Products visible without a long category sidebar');
    }
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`artifacts/refinements/shop-${width}.png`,animations:'disabled'});
    await page.goto(base+'/products/prod_lavender?option=330ml',{waitUntil:'domcontentloaded'});
    await page.locator('.shea-product-size').getByRole('button',{name:'330ml',exact:true}).waitFor();
    await page.waitForFunction(()=>document.querySelector('.shea-product-price')?.textContent==='KSh 1,500');
    assert.equal(await page.locator('.product-film-toggle').getAttribute('open'),null);
    await page.getByLabel('Product quantity',{exact:true}).fill('2');
    await page.getByRole('button',{name:'Add to cart',exact:true}).first().click();
    await page.getByText(/added to cart\./).waitFor();
    const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('sheaWellnessCart')));
    const line=cart.find(item=>item.productId==='prod_lavender');
    assert.equal(line.size,'330ml');assert.equal(line.quantity,2);assert.equal(line.price,1500);
    assert.ok(await page.locator('.refined-recommendations .shop-product-card').count()>0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:`artifacts/refinements/pdp-${width}.png`,animations:'disabled'});
    assert.deepEqual(errors,[]);results.push({width,carousel:true,routines:true,options:true,cart:true});console.log('PASS refined shop, campaign, routines, cart',width);await context.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(60000);
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('[data-cart-ready=true]').waitFor();
  for(const kind of ['results','partners']){
    const rail=page.locator('.auto-rail-'+kind);await rail.scrollIntoViewIfNeeded();
    await page.mouse.move(0,0);await page.waitForTimeout(100);
    const track=rail.locator('.auto-rail-track');
    const before=await track.evaluate(el=>el.scrollLeft);await page.waitForTimeout(700);
    const after=await track.evaluate(el=>el.scrollLeft);assert.ok(after>before+5,kind+' auto scroll');
    await rail.hover();const paused=await track.evaluate(el=>el.scrollLeft);await page.waitForTimeout(400);
    assert.ok(Math.abs(await track.evaluate(el=>el.scrollLeft)-paused)<2,kind+' hover pause');
    await rail.getByRole('button',{name:/Next /}).click();await page.waitForTimeout(500);
    assert.ok(await track.evaluate(el=>el.scrollLeft)>paused+100,kind+' manual controls');
    await rail.locator('[data-carousel-original] img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
  }
  assert.equal(await page.locator('.owner-progress figcaption').filter({hasText:/hand care|face care/i}).count(),0);
  for(const asset of [...specification.images,...specification.videos]){
    assert.ok([...content.media.images,...content.media.videos].some(item=>item.src===asset.src),asset.src+' in library');
    const response=await fetch(base+asset.src,{headers:{Range:'bytes=0-31'}});assert.ok([200,206].includes(response.status),asset.src);
  }
  // Browser-only media persistence fixtures: no QA images are published in the real library.
  let media={heroSlides:[],images:[],videos:[],documents:[],presentationVersion:1};let uploads=0,saves=0,failSave=true;
  await page.route('**/api/admin/content',route=>{
    if(route.request().method()==='PUT'){
      saves++;if(failSave){failSave=false;return route.fulfill({status:503,json:{error:'QA save interruption'}});}
      media=route.request().postDataJSON().media;
    }
    return route.fulfill({json:{data:{...content,media,persisted:true}}});
  });
  const image=await readFile('public'+specification.images[0].src);
  await page.route('**/api/admin/upload',route=>{
    uploads++;if(uploads===1)return route.fulfill({status:503,json:{error:'QA retry'}});
    return route.fulfill({status:201,json:{data:{url:specification.images[0].src,publicId:'qa_'+uploads}}});
  });
  await page.goto(base+'/admin',{waitUntil:'domcontentloaded'});await page.locator('[data-admin-ready=true]').waitFor();
  await page.locator('.shea-admin-sidebar').getByRole('button',{name:'Media library',exact:true}).click();
  const manager=page.getByRole('region',{name:'Bulk media manager'});
  const archive=zipSync({'folder/beauty.webp':image,'folder/duplicate.webp':image,'notes.txt':Buffer.from('Skip me'),'../unsafe.webp':image});
  await manager.getByLabel('Media display location').selectOption('partners');
  await manager.getByLabel('Bulk files or ZIP').setInputFiles({name:'qa-media.zip',mimeType:'application/zip',buffer:Buffer.from(archive)});
  await manager.getByText(/Files uploaded, but library changes were not saved/).waitFor();
  assert.equal(uploads,2,'Duplicate skipped and interrupted upload retried');assert.equal(media.images.length,0);
  await manager.getByRole('button',{name:'Save uploaded files',exact:true}).click();
  await manager.getByText('Uploaded files saved to the library.',{exact:true}).waitFor();
  assert.equal(uploads,2,'Saving again must not upload again');assert.equal(media.images.length,1);assert.deepEqual(media.images[0].placements,['partners']);
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-admin-ready=true]').waitFor();
  await page.locator('.shea-admin-sidebar').getByRole('button',{name:'Media library',exact:true}).click();
  await manager.getByRole('checkbox',{name:'Select beauty',exact:true}).check();
  await manager.getByRole('button',{name:'Remove from sections',exact:true}).click();
  await manager.getByText('Selected media updated on the storefront.',{exact:true}).waitFor();
  assert.deepEqual(media.images[0].placements,[]);
  await manager.getByRole('checkbox',{name:'Select beauty',exact:true}).check();
  page.once('dialog',dialog=>dialog.accept());await manager.getByRole('button',{name:'Remove from library',exact:true}).click();
  await manager.getByText('No media matches this search.',{exact:true}).waitFor();assert.equal(media.images.length,0);
  assert.ok(saves>=4);results.push({runningRails:true,zipResources:specification.images.length+specification.videos.length,bulkRetry:true,saveRetry:true,placementPersistence:true,removal:true});
  await writeFile('artifacts/refinements/results.json',JSON.stringify(results,null,2));
  console.log('PASS: four responsive beauty/shop/PDP layouts, exact variation prices, quantity/cart, running rails, supplied ZIP resources, bulk ZIP duplicate filtering, upload retry, save retry without reupload, placement/reload, removal.');
}finally{await browser.close();}
