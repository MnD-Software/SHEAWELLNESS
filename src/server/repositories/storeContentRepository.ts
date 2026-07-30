import { neon } from "@neondatabase/serverless";
import { platformSnapshot } from "@/lib/platform-data";
import { sanitizeSheaMediaConfig, sheaDefaultMediaConfig, type SheaMediaConfig } from "@/lib/shea-content";
import type { Product } from "@/lib/types";

export type StoreContent = {
  products: Product[];
  media: SheaMediaConfig;
  persisted: boolean;
  updatedAt: string | null;
};

const STORE_KEY = "shea-wellness";

function defaults(): StoreContent {
  return {
    products: platformSnapshot.products,
    media: sheaDefaultMediaConfig,
    persisted: false,
    updatedAt: null
  };
}

function database() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? neon(connectionString) : null;
}

async function ensureTable(sql: NonNullable<ReturnType<typeof database>>) {
  await sql`
    CREATE TABLE IF NOT EXISTS storefront_content (
      store_key TEXT PRIMARY KEY,
      products JSONB NOT NULL,
      media JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function getStoreContent(): Promise<StoreContent> {
  const sql = database();
  if (!sql) return defaults();

  await ensureTable(sql);
  const rows = await sql`
    SELECT products, media, updated_at
    FROM storefront_content
    WHERE store_key = ${STORE_KEY}
    LIMIT 1
  `;

  if (!rows.length) return defaults();
  return {
    products: rows[0].products as Product[],
    media: sanitizeSheaMediaConfig(rows[0].media as SheaMediaConfig),
    persisted: true,
    updatedAt: new Date(rows[0].updated_at as string).toISOString()
  };
}

export async function saveProducts(products: Product[]): Promise<StoreContent> {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured.");
  await ensureTable(sql);
  const media = (await getStoreContent()).media;
  await sql`
    INSERT INTO storefront_content (store_key, products, media)
    VALUES (${STORE_KEY}, ${JSON.stringify(products)}::jsonb, ${JSON.stringify(media)}::jsonb)
    ON CONFLICT (store_key) DO UPDATE
    SET products = EXCLUDED.products, updated_at = NOW()
  `;
  return getStoreContent();
}

export async function saveMedia(media: SheaMediaConfig): Promise<StoreContent> {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured.");
  await ensureTable(sql);
  const products = (await getStoreContent()).products;
  const safeMedia = sanitizeSheaMediaConfig(media);
  await sql`
    INSERT INTO storefront_content (store_key, products, media)
    VALUES (${STORE_KEY}, ${JSON.stringify(products)}::jsonb, ${JSON.stringify(safeMedia)}::jsonb)
    ON CONFLICT (store_key) DO UPDATE
    SET media = EXCLUDED.media, updated_at = NOW()
  `;
  return getStoreContent();
}
