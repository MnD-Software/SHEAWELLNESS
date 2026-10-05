import { neon } from "@neondatabase/serverless";
import { platformSnapshot } from "@/lib/platform-data";

function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  return neon(process.env.DATABASE_URL);
}
async function settingsTable() {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS storefront_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  return sql;
}
export async function readTheme() {
  const sql = await settingsTable();
  const rows = await sql`SELECT value FROM storefront_settings WHERE key = 'shea-theme'`;
  return rows[0]?.value ?? platformSnapshot.theme;
}
export async function readStorefrontSettings() {
  const sql = await settingsTable();
  const rows = await sql`SELECT value FROM storefront_settings WHERE key = 'shea-storefront'`;
  return { wellnessGuidesEnabled: rows[0]?.value?.wellnessGuidesEnabled === true };
}
export async function saveStorefrontSettings(value: { wellnessGuidesEnabled: boolean }) {
  const sql = await settingsTable();
  await sql`INSERT INTO storefront_settings (key, value) VALUES ('shea-storefront', ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
  return value;
}
export async function listEnquiries() {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS storefront_enquiries (id TEXT PRIMARY KEY, details JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  return sql`SELECT id, details, created_at FROM storefront_enquiries ORDER BY created_at DESC LIMIT 100`;
}
export async function saveTheme(value: unknown) {
  const sql = await settingsTable();
  await sql`INSERT INTO storefront_settings (key, value) VALUES ('shea-theme', ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
  return value;
}
export async function saveEnquiry(input: { name: string; email: string; type: string; message: string }) {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS storefront_enquiries (id TEXT PRIMARY KEY, details JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  const id = crypto.randomUUID();
  await sql`INSERT INTO storefront_enquiries (id, details) VALUES (${id}, ${JSON.stringify(input)}::jsonb)`;
  return id;
}
