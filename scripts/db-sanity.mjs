import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
const envFile = await readFile('.env.local', 'utf8');
const connection = process.env.DATABASE_URL || envFile.match(/^DATABASE_URL\s*=\s*["']?([^\r\n"']+)/m)?.[1];
assert.ok(connection, 'DATABASE_URL must be configured');
const sql = neon(connection);
const base = process.env.SMOKE_URL || 'http://localhost:3140';
const headers = { 'content-type': 'application/json', 'x-shea-admin-key': process.env.SMOKE_ADMIN_KEY || '' };
let productId, orderId, enquiryId, mediaId;
async function request(path, method = 'GET', data) {
  const response = await fetch(base + path, { method, headers, body: data ? JSON.stringify(data) : undefined });
  const payload = await response.json();
  return { status: response.status, ...payload };
}
try {
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKioAAAAASUVORK5CYII=', 'base64');
  const uploadForm = new FormData();
  uploadForm.set('file', new Blob([image], { type: 'image/png' }), 'qa-smoke-pixel.png');
  const uploadResponse = await fetch(base + '/api/admin/upload', { method: 'POST', headers: { 'x-shea-admin-key': headers['x-shea-admin-key'] }, body: uploadForm });
  assert.equal(uploadResponse.status, 201);
  const uploaded = (await uploadResponse.json()).data;
  assert.equal(uploaded.storage, 'database', 'Run this QA upload only against Neon-backed test storage');
  mediaId = uploaded.publicId;
  const mediaResponse = await fetch(base + uploaded.url);
  assert.equal(mediaResponse.status, 200);
  assert.deepEqual(Buffer.from(await mediaResponse.arrayBuffer()), image, 'Uploaded media must survive a separate retrieval');
  const settings = await request('/api/admin/settings');
  assert.equal(settings.status, 200);
  const savedSettings = await request('/api/admin/settings', 'PUT', settings.data);
  assert.equal(savedSettings.status, 200);
  const settingsRows = await sql`SELECT value FROM storefront_settings WHERE key = 'shea-storefront'`;
  assert.deepEqual(settingsRows[0].value, settings.data, 'Store settings must be persisted for all visitors');
  const created = await request('/api/admin/products', 'POST', { title: 'QA temporary draft', description: 'Automated database persistence verification only', price: 12, inventoryQty: 1, status: 'draft' });
  assert.equal(created.status, 201); productId = created.data.id;
  const catalogue = await request('/api/admin/products');
  assert.ok(catalogue.data.some(product => product.id === productId), 'Created product must survive a separate read');
  const content = (await request('/api/storefront/content')).data;
  assert.equal(content.persisted, true);
  const product = content.products.find(product => ['active', 'low_stock'].includes(product.status) && product.inventoryQty > 1);
  const size = product.sizes[0];
  const input = { requestId: crypto.randomUUID(), customer: { email: 'qa-smoke@example.invalid', fullName: 'Automated QA', phone: '0700000000', address: 'QA test address', country: 'Kenya', city: 'Nairobi', deliveryMethod: 'kenya', paymentMethod: 'mpesa' }, items: [{ productId: product.id, size, quantity: 1, unitPrice: 1 }], totals: { total: 1 } };
  const order = await request('/api/storefront/checkout', 'POST', input);
  assert.equal(order.status, 201); orderId = order.data.id;
  assert.equal(order.data.total, product.sizePrices?.[size] ?? product.price, 'Server must ignore forged browser prices');
  const replay = await request('/api/storefront/checkout', 'POST', input);
  assert.equal(replay.status, 200); assert.equal(replay.data.id, orderId);
  const conflict = await request('/api/storefront/checkout', 'POST', { ...input, customer: { ...input.customer, email: 'other@example.invalid' } });
  assert.equal(conflict.status, 409);
  const update = await request('/api/admin/orders', 'PATCH', { id: orderId, fulfillmentStatus: 'on_hold' });
  assert.equal(update.status, 200);
  const rows = await sql`SELECT fulfillment_status FROM storefront_orders WHERE id = ${orderId}`;
  assert.equal(rows[0].fulfillment_status, 'on_hold');
  const enquiry = await request('/api/storefront/enquiries', 'POST', { name: 'QA temporary enquiry', email: 'qa-smoke@example.invalid', type: 'Wholesale', message: 'Automated persistence verification only.' });
  assert.equal(enquiry.status, 201); enquiryId = enquiry.data.id;
  const enquiries = await request('/api/admin/enquiries');
  assert.ok(enquiries.data.some(item => item.id === enquiryId));
  console.log('PASS: Neon media upload/read, global settings, product create/read, canonical order pricing, idempotent retry, conflicting retry rejection, order status persistence, and enquiry create/read.');
} finally {
  // Remove only the exact temporary records created by this test run.
  if (productId) await sql`UPDATE storefront_content SET products = (SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) FROM jsonb_array_elements(products) item WHERE item->>'id' <> ${productId}) WHERE store_key = 'shea-wellness'`;
  if (orderId) await sql`DELETE FROM storefront_orders WHERE id = ${orderId} AND customer->>'email' = 'qa-smoke@example.invalid'`;
  if (enquiryId) await sql`DELETE FROM storefront_enquiries WHERE id = ${enquiryId} AND details->>'email' = 'qa-smoke@example.invalid'`;
  if (mediaId) await sql`DELETE FROM storefront_media_uploads WHERE id = ${mediaId} AND filename = 'qa-smoke-pixel.png'`;
  console.log('Temporary QA records cleaned up.');
}
