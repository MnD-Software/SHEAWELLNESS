import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

type UploadedImage = {
  id: string;
  contentType: string;
  filename: string;
  dataBase64: string;
};

let tableReady: Promise<void> | null = null;

function database() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? neon(connectionString) : null;
}

async function ensureTable(sql: NonNullable<ReturnType<typeof database>>) {
  if (!tableReady) {
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS storefront_media_uploads (
          id TEXT PRIMARY KEY,
          content_type TEXT NOT NULL,
          filename TEXT NOT NULL,
          data_base64 TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }

  await tableReady;
}

function cleanFilename(filename: string) {
  const normalized = filename.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return (normalized || "image").slice(0, 180);
}

export async function saveUploadedImage(input: { filename: string; contentType: string; dataBase64: string }) {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured for image uploads.");

  await ensureTable(sql);
  const id = randomUUID();
  await sql`
    INSERT INTO storefront_media_uploads (id, content_type, filename, data_base64)
    VALUES (${id}, ${input.contentType}, ${cleanFilename(input.filename)}, ${input.dataBase64})
  `;

  return { id, url: `/api/media?id=${encodeURIComponent(id)}` };
}

export async function getUploadedImage(id: string): Promise<UploadedImage | null> {
  const sql = database();
  if (!sql) return null;

  await ensureTable(sql);
  const rows = await sql`
    SELECT id, content_type, filename, data_base64
    FROM storefront_media_uploads
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!rows.length) return null;
  const row = rows[0] as { id: string; content_type: string; filename: string; data_base64: string };
  return {
    id: row.id,
    contentType: row.content_type,
    filename: row.filename,
    dataBase64: row.data_base64
  };
}
