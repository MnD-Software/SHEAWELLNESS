import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
const specification = JSON.parse(await readFile(new URL('./owner-content-2026-10-09.json', import.meta.url), 'utf8'));
const env = await readFile('.env.local', 'utf8').catch(() => '');
const connection = process.env.DATABASE_URL || env.match(/^DATABASE_URL\s*=\s*["']?([^\r\n"']+)/m)?.[1];
assert.ok(connection, 'DATABASE_URL must be configured');
const sql = neon(connection);
const [original] = await sql`SELECT products, media, page_overrides, updated_at, updated_at::text AS revision FROM storefront_content WHERE store_key = 'shea-wellness'`;
assert.ok(original, 'An existing storefront is required');
const updated = new Map(specification.updates.map(item => [item.id,item]));
function applyMedia(product, change) {
  const {video, ...values} = change;
  const result = {...product, ...values};
  if (video) result.sizeMedia = Object.fromEntries(result.sizes.map(size => [size, {...result.sizeMedia?.[size],videoUrl:`/assets/owner-oct-2026/${video}.mp4`}]));
  return result;
}
const products = original.products.map(product => applyMedia(product, updated.get(product.id) || {}));
for (const addition of specification.additions) {
  if (products.some(product => product.id === addition.id)) continue;
  products.push(applyMedia({storeId:original.products[0].storeId,badge:'',imageUrl:'',imagePosition:'50% 50%',rating:0,reviewCount:0,colors:['Standard'],material:'Shea Wellness owner-supplied catalogue',deliveryBadge:'Contact us for availability',inventoryQty:0,status:'active',channel:'online',sales:0,...addition},addition));
}
const media = {...original.media,heroSlides:specification.heroSlides,images:[...original.media.images.filter(item => !item.id.startsWith('owner_oct_')), ...specification.images],videos:[...original.media.videos.filter(item => !item.id.startsWith('owner_oct_')), ...specification.videos]};
for (const item of [...specification.images,...specification.videos,...specification.heroSlides]) await readFile('public'+item.src);
for (const product of products) {
  for (const src of [product.imageUrl,...Object.values(product.sizeMedia || {}).flatMap(option => [option.imageUrl,option.videoUrl])]) {
    if (src?.startsWith('/assets/owner-oct-2026/')) await readFile('public'+src);
  }
}
console.log(JSON.stringify({products:products.length,updatedExisting:specification.updates.length,added:products.length-original.products.length,images:specification.images.length,videos:specification.videos.length,campaigns:media.heroSlides.length,apply:process.argv.includes('--apply')}));
if (!process.argv.includes('--apply')) process.exit(0);
await mkdir('artifacts/owner-import',{recursive:true});
await writeFile(`artifacts/owner-import/before-${Date.now()}.json`,JSON.stringify(original,null,2));
// Refuse to overwrite a concurrent dashboard edit. The import is one atomic update.
const result = await sql`UPDATE storefront_content SET products=${JSON.stringify(products)}::jsonb,media=${JSON.stringify(media)}::jsonb,updated_at=NOW() WHERE store_key='shea-wellness' AND updated_at=${original.revision}::timestamptz RETURNING updated_at`;
assert.equal(result.length,1,'Catalogue changed during import; reload and review before retrying');
console.log('Saved owner-supplied content atomically. Existing inventory and unrelated products were preserved.');
