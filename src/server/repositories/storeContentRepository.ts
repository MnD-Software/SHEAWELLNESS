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
const VERIFIED_PRODUCT_IMAGES: Record<string, string> = {
  prod_chebe_serum: "/assets/media-library/aug-2026/aug-2026-026.jpeg",
  prod_yellow_castor_oil: "/assets/media-library/aug-2026/aug-2026-028.jpeg",
  prod_essential_oils: "/assets/media-library/aug-2026/aug-2026-025.jpeg",
  prod_aromatherapy: "/assets/media-library/aug-2026/aug-2026-030.jpeg",
  prod_spa_essentials: "/assets/media-library/aug-2026/aug-2026-035.jpeg",
  prod_gift_set: "/assets/media-library/aug-2026/aug-2026-025.jpeg",
  prod_distributor_offer: "/assets/media-library/aug-2026/aug-2026-031.jpeg"
};

function withoutUnverifiedPrices(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    imageUrl: VERIFIED_PRODUCT_IMAGES[product.id] ?? product.imageUrl,
    status: product.id === "prod_chebe_butter" ? "draft" : product.status,
    price: 0,
    sizePrices: undefined
  }));
}

function defaults(): StoreContent {
  return {
    products: withoutUnverifiedPrices(platformSnapshot.products),
    media: sheaDefaultMediaConfig,
    persisted: false,
    updatedAt: null
  };
}

function database() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? neon(connectionString) : null;
}

let tableReady: Promise<void> | null = null;

async function ensureTable(sql: NonNullable<ReturnType<typeof database>>) {
  if (!tableReady) {
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS storefront_content (
          store_key TEXT PRIMARY KEY,
          products JSONB NOT NULL,
          media JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
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
    products: withoutUnverifiedPrices(rows[0].products as Product[]),
    media: sanitizeSheaMediaConfig(rows[0].media as SheaMediaConfig),
    persisted: true,
    updatedAt: new Date(rows[0].updated_at as string).toISOString()
  };
}

export async function saveProducts(products: Product[]) {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured.");
  await ensureTable(sql);
  const safeProducts = withoutUnverifiedPrices(products);
  const rows = await sql`
    INSERT INTO storefront_content (store_key, products, media)
    VALUES (${STORE_KEY}, ${JSON.stringify(safeProducts)}::jsonb, ${JSON.stringify(sheaDefaultMediaConfig)}::jsonb)
    ON CONFLICT (store_key) DO UPDATE
    SET products = EXCLUDED.products, updated_at = NOW()
    RETURNING updated_at
  `;
  return { persisted: true, updatedAt: new Date(rows[0].updated_at as string).toISOString() };
}

export async function saveMedia(media: SheaMediaConfig) {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured.");
  await ensureTable(sql);
  const safeMedia = sanitizeSheaMediaConfig(media);
  const rows = await sql`
    INSERT INTO storefront_content (store_key, products, media)
    VALUES (${STORE_KEY}, ${JSON.stringify(withoutUnverifiedPrices(platformSnapshot.products))}::jsonb, ${JSON.stringify(safeMedia)}::jsonb)
    ON CONFLICT (store_key) DO UPDATE
    SET media = EXCLUDED.media, updated_at = NOW()
    RETURNING updated_at
  `;
  return { persisted: true, updatedAt: new Date(rows[0].updated_at as string).toISOString() };
}
