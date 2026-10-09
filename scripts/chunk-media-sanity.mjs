import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {neon} from '@neondatabase/serverless';
const base=process.env.SMOKE_URL||'http://localhost:3140';
const environment=await readFile('.env.local','utf8');
const connection=process.env.DATABASE_URL||environment.match(/^DATABASE_URL\s*=\s*["']?([^\r\n"']+)/m)?.[1];
const sql=neon(connection);const ids=[];
const json={'content-type':'application/json'};
async function post(body){return fetch(base+'/api/admin/upload/chunks',{method:'POST',headers:json,body:JSON.stringify(body)});}
try{
  const bytes=await readFile('public/assets/owner-oct-2026/cosmetics-flyer.pdf');
  assert.ok(bytes.length>3*1024*1024,'Exercise upload beyond single request size');
  const begun=await post({filename:'qa-chunk-brochure.pdf',contentType:'application/pdf',size:bytes.length});assert.equal(begun.status,201);
  const {data:session}=await begun.json();ids.push(session.id);
  assert.equal((await post({action:'complete',id:session.id})).status,400,'Missing parts rejected');
  for(let index=0;index<Math.ceil(bytes.length/session.chunkBytes);index++){
    const form=new FormData();form.set('id',session.id);form.set('index',String(index));form.set('file',new Blob([bytes.subarray(index*session.chunkBytes,(index+1)*session.chunkBytes)]),'part');
    assert.equal((await fetch(base+'/api/admin/upload/chunks',{method:'PUT',body:form})).status,200);
    if(index===0)assert.equal((await fetch(base+'/api/admin/upload/chunks',{method:'PUT',body:form})).status,200,'Idempotent part retry');
  }
  const completed=await post({action:'complete',id:session.id});assert.equal(completed.status,200);
  const {data:uploaded}=await completed.json();
  assert.equal((await post({action:'complete',id:session.id})).status,200,'Idempotent completion');
  const full=await fetch(base+uploaded.url);assert.equal(full.status,200);assert.deepEqual(Buffer.from(await full.arrayBuffer()),bytes);
  const partial=await fetch(base+uploaded.url,{headers:{Range:'bytes=10-109'}});assert.equal(partial.status,206);
  assert.equal(partial.headers.get('content-range'),`bytes 10-109/${bytes.length}`);assert.deepEqual(Buffer.from(await partial.arrayBuffer()),bytes.subarray(10,110));
  assert.equal((await fetch(base+uploaded.url,{headers:{Range:`bytes=${bytes.length}-`}})).status,416);
  const filmBytes=await readFile('public/assets/owner-zips-2026/s4-30-product-film.mp4');
  const filmStart=await post({filename:'qa-chunk-film.mp4',contentType:'video/mp4',size:filmBytes.length});assert.equal(filmStart.status,201);
  const filmSession=(await filmStart.json()).data;ids.push(filmSession.id);
  for(let index=0;index<Math.ceil(filmBytes.length/filmSession.chunkBytes);index++){
    const form=new FormData();form.set('id',filmSession.id);form.set('index',String(index));form.set('file',new Blob([filmBytes.subarray(index*filmSession.chunkBytes,(index+1)*filmSession.chunkBytes)]),'part');
    assert.equal((await fetch(base+'/api/admin/upload/chunks',{method:'PUT',body:form})).status,200);
  }
  const filmComplete=await post({action:'complete',id:filmSession.id});assert.equal(filmComplete.status,200);
  const filmUrl=(await filmComplete.json()).data.url;
  const {chromium}=await import(process.env.QA_PLAYWRIGHT_MODULE||'playwright');
  const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_PATH||undefined});
  try{
    const page=await browser.newPage();await page.goto(base+'/admin',{waitUntil:'domcontentloaded'});
    const metadata=await page.evaluate(url=>new Promise((resolve,reject)=>{
      const video=document.createElement('video');video.preload='metadata';video.src=url;
      const timeout=setTimeout(()=>reject(new Error('Uploaded video metadata timed out')),30000);
      video.onloadedmetadata=()=>{clearTimeout(timeout);resolve({width:video.videoWidth,duration:video.duration});};
      video.onerror=()=>{clearTimeout(timeout);reject(new Error('Uploaded video failed to play'));};document.body.append(video);
    }),filmUrl);assert.ok(metadata.width>0&&metadata.duration>0);
  }finally{await browser.close();}
  const invalid=await post({filename:'qa-wrong.png',contentType:'image/png',size:8});assert.equal(invalid.status,201);
  const bad=(await invalid.json()).data.id;ids.push(bad);const badForm=new FormData();badForm.set('id',bad);badForm.set('index','0');badForm.set('file',new Blob(['BADBYTES']),'part');
  assert.equal((await fetch(base+'/api/admin/upload/chunks',{method:'PUT',body:badForm})).status,200);
  assert.equal((await post({action:'complete',id:bad})).status,400,'Incorrect media contents rejected');
  assert.equal((await fetch(base+'/api/admin/upload/chunks?id='+bad,{method:'DELETE'})).status,200);
  console.log(`PASS: ${bytes.length} byte PDF and ${filmBytes.length} byte MP4 chunk uploads, actual video metadata, missing-part rejection, part/completion retries, exact full streamed retrieval, byte ranges, invalid range rejection, signature checks and cancellation.`);
}finally{
  for(const id of ids){await sql`DELETE FROM storefront_upload_sessions WHERE id=${id}`;await sql`DELETE FROM storefront_media_uploads WHERE id=${id}`;}
}
