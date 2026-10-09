import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const playwright=await import(process.env.QA_PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.QA_BROWSER_ENGINE||'chromium';
const browser=await playwright[engine].launch({headless:true,executablePath:process.env.QA_BROWSER_PATH||undefined});
const base=process.env.SMOKE_URL||'http://localhost:3140';
const data=(await(await fetch(base+'/api/storefront/content')).json()).data;
const assets=[...new Map([...data.media.heroSlides,...data.media.images,...data.products.map(product=>({src:product.imageUrl,title:product.title,type:'image'}))].filter(asset=>asset.type==='image'&&asset.src).map(asset=>[asset.src,asset])).values()];
const samples=[assets.find(asset=>asset.src.includes('before-after-dry-skin')),assets.find(asset=>asset.src.includes('partner-')),assets.find(asset=>asset.src.includes('lavender-open'))];
await mkdir('artifacts/media-picker',{recursive:true});const results=[];
try{
  for(const width of [320,390,768,1832]){
    const page=await browser.newPage({viewport:{width,height:1000}});page.setDefaultTimeout(60000);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/admin',{waitUntil:'domcontentloaded'});await page.locator('[data-admin-ready=true]').waitFor();
    await page.locator('.shea-admin-sidebar').getByRole('button',{name:'Products',exact:true}).click();
    await page.getByRole('button',{name:'Edit',exact:true}).first().click();
    await page.getByRole('button',{name:'Choose from media library',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Choose an image',exact:true});const grid=dialog.locator('.shea-media-picker-grid');
    let verified=0;
    do{
      await grid.locator('img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
      const metrics=await grid.locator('article').evaluateAll(cards=>cards.map(card=>{
        const image=card.querySelector('img'),button=card.querySelector('.media-picker-image'),caption=card.querySelector('span'),preview=card.querySelector('.media-picker-preview-button');
        const box=card.getBoundingClientRect(),img=image.getBoundingClientRect(),photo=button.getBoundingClientRect(),text=caption.getBoundingClientRect(),action=preview.getBoundingClientRect();
        return {height:box.height,imageHeight:img.height,photoHeight:photo.height,fit:getComputedStyle(image).objectFit,loaded:image.naturalWidth>0,contentFits:img.top>=box.top&&img.bottom<=box.bottom&&text.bottom<=box.bottom&&action.bottom<=box.bottom};
      }));
      assert.ok(metrics.length>0&&metrics.every(item=>item.loaded&&item.fit==='contain'&&item.contentFits&&item.height>=item.imageHeight+60&&item.imageHeight<=item.photoHeight+1),'No squeezed thumbnails or hidden captions');
      if(!verified)await page.screenshot({path:`artifacts/media-picker/${engine}-${width}-thumbnails.png`});
      verified+=metrics.length;
      const next=dialog.getByRole('button',{name:'Next',exact:true});if(!await next.count()||await next.isDisabled())break;await next.click();
    }while(true);
    assert.equal(verified,assets.length,'Every image in the library appears across the pages');
    for(const sample of samples){
      assert.ok(sample);await dialog.getByPlaceholder('Search media library').fill(sample.title);
      const card=grid.locator(`article:has(img[src="${sample.src}"])`).first();
      await card.getByRole('button',{name:/Preview /}).click();
      const preview=dialog.getByRole('region',{name:'Full image preview',exact:true});await preview.locator('img').evaluate(image=>image.decode());
      assert.equal(await preview.locator('img').getAttribute('src'),sample.src);
      assert.equal(await preview.locator('img').evaluate(image=>getComputedStyle(image).objectFit),'contain');
      const previewBox=await preview.boundingBox();assert.ok(previewBox.x>=0&&previewBox.x+previewBox.width<=width+1);
      await page.screenshot({path:`artifacts/media-picker/${engine}-${width}-${sample.src.includes('partner-')?'logo':sample.src.includes('dry-skin')?'portrait':'landscape'}.png`});
      await page.keyboard.press('Escape');await preview.waitFor({state:'hidden'});assert.ok(await dialog.isVisible());
    }
    await dialog.getByPlaceholder('Search media library').fill(samples[2].title);
    await grid.locator(`article:has(img[src="${samples[2].src}"])`).getByRole('button',{name:/Preview /}).click();
    await dialog.getByRole('button',{name:'Use this image',exact:true}).click();await dialog.waitFor({state:'hidden'});
    assert.equal(await page.locator('.shea-admin-image-field img').getAttribute('src'),samples[2].src,'Preview selection updates only the product draft');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
    results.push({width,images:verified,fullPreviews:3,selection:true});console.log(`PASS ${engine} ${width}: ${verified} complete thumbnails, portrait/logo/landscape previews and image selection.`);await page.close();
  }
  await writeFile(`artifacts/media-picker/${engine}-results.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}
