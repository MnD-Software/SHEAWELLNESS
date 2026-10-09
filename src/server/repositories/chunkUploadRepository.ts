import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { MEDIA_CHUNK_BYTES, mediaSizeLimit, mediaTypes, validMediaSignature } from '@/lib/media-file-types';
import { getUploadedImage } from './mediaUploadRepository';

let ready: Promise<void> | null = null;
async function database() {
  if (!process.env.DATABASE_URL) throw new Error('Media storage is unavailable.');
  const sql = neon(process.env.DATABASE_URL);
  if (!ready) ready = (async () => {
    await sql`CREATE TABLE IF NOT EXISTS storefront_upload_sessions (id TEXT PRIMARY KEY, filename TEXT NOT NULL, content_type TEXT NOT NULL, byte_size INTEGER NOT NULL, part_count INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS storefront_upload_parts (session_id TEXT REFERENCES storefront_upload_sessions(id) ON DELETE CASCADE, part_index INTEGER NOT NULL, data_base64 TEXT NOT NULL, PRIMARY KEY(session_id, part_index))`;
  })().catch(error => {ready = null; throw error;});
  await ready; return sql;
}
export async function beginMediaUpload(input: { filename: string; contentType: string; size: number }) {
  if (!Object.values(mediaTypes).includes(input.contentType) || !Number.isInteger(input.size) || input.size < 1 || input.size > mediaSizeLimit(input.contentType)) throw new Error('Unsupported media type or file size.');
  const sql = await database(); const id = randomUUID();
  await sql`DELETE FROM storefront_upload_sessions WHERE created_at < NOW() - INTERVAL '24 hours'`;
  await sql`INSERT INTO storefront_upload_sessions (id, filename, content_type, byte_size, part_count) VALUES (${id}, ${input.filename.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 180)}, ${input.contentType}, ${input.size}, ${Math.ceil(input.size / MEDIA_CHUNK_BYTES)})`;
  return {id, chunkBytes: MEDIA_CHUNK_BYTES};
}
export async function saveMediaChunk(id: string, index: number, bytes: Buffer) {
  const sql = await database();
  const [session] = await sql`SELECT byte_size, part_count FROM storefront_upload_sessions WHERE id=${id} AND created_at > NOW() - INTERVAL '24 hours'`;
  if (!session || !Number.isInteger(index) || index < 0 || index >= session.part_count) throw new Error('Upload session or part is invalid.');
  const expected = Math.min(MEDIA_CHUNK_BYTES, session.byte_size - index * MEDIA_CHUNK_BYTES);
  if (bytes.length !== expected) throw new Error('Upload part has an incorrect size.');
  await sql`INSERT INTO storefront_upload_parts (session_id, part_index, data_base64) VALUES (${id}, ${index}, ${bytes.toString('base64')}) ON CONFLICT (session_id, part_index) DO UPDATE SET data_base64=EXCLUDED.data_base64`;
}
export async function completeMediaUpload(id: string) {
  const existing = await getUploadedImage(id);
  if (existing) return {url: `/api/media?id=${id}`, publicId: id, storage: 'database'};
  const sql = await database();
  const [session] = await sql`SELECT * FROM storefront_upload_sessions WHERE id=${id} AND created_at > NOW() - INTERVAL '24 hours'`;
  if (!session) throw new Error('Upload session expired. Please upload the file again.');
  const parts = await sql`SELECT part_index, data_base64 FROM storefront_upload_parts WHERE session_id=${id} ORDER BY part_index`;
  if (parts.length !== session.part_count || parts.some((part, index) => part.part_index !== index)) throw new Error('The upload is incomplete. Retry the missing parts.');
  const bytes = Buffer.concat(parts.map(part => Buffer.from(part.data_base64, 'base64')));
  if (bytes.length !== session.byte_size || !validMediaSignature(bytes, session.content_type)) throw new Error('The uploaded file does not match its media type.');
  await sql.transaction([
    sql`INSERT INTO storefront_media_uploads (id, content_type, filename, data_base64) VALUES (${id}, ${session.content_type}, ${session.filename}, ${bytes.toString('base64')}) ON CONFLICT (id) DO NOTHING`,
    sql`DELETE FROM storefront_upload_sessions WHERE id=${id}`
  ]);
  return {url: `/api/media?id=${id}`, publicId: id, storage: 'database'};
}
export async function cancelMediaUpload(id: string) {
  const sql = await database(); await sql`DELETE FROM storefront_upload_sessions WHERE id=${id}`;
}
