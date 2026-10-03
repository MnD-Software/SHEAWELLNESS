import { neon } from "@neondatabase/serverless";
import { platformSnapshot } from "@/lib/platform-data";
import { sanitizeSheaMediaConfig, sheaDefaultMediaConfig, type SheaMediaConfig } from "@/lib/shea-content";
import type { Product } from "@/lib/types";

export type StoreContent = {
  products: Product[];
  media: SheaMediaConfig;
  pageOverrides: PageOverrides;
  persisted: boolean;
  updatedAt: string | null;
};

export type PageOverrides = Record<string, { texts?: Record<string, string>; images?: Record<string, string> }>;

const STORE_KEY = "shea-wellness";
const VERIFIED_PRODUCT_IMAGES: Record<string, string> = {
  prod_chebe_serum: "/assets/media-library/aug-2026/aug-2026-026.jpeg",
  prod_chebe_butter: "/assets/media-library/aug-2026/aug-2026-043.jpeg",
  prod_yellow_castor_oil: "/assets/media-library/aug-2026/aug-2026-028.jpeg",
  prod_essential_oils: "/assets/media-library/aug-2026/aug-2026-025.jpeg",
  prod_aromatherapy: "/assets/media-library/aug-2026/aug-2026-030.jpeg",
  prod_spa_essentials: "/assets/media-library/aug-2026/aug-2026-057.jpeg",
  prod_gift_set: "/assets/media-library/aug-2026/aug-2026-025.jpeg"
};

// These catalogue records previously displayed lifestyle/result images as if
// they were product pack shots. Keep them out of the public catalogue until a
// verified, product-specific asset is supplied by Shea Wellness.
const PRODUCTS_AWAITING_VERIFIED_MEDIA = new Set([
  "prod_rosehip_facial_oil",
  "prod_cucumber_mint_sunscreen",
  "prod_baobab_oil",
  "prod_distributor_offer"
]);

function normalizeStoredProducts(products: Product[]): Product[] {
  return products.map((product) => {
    const sizes = product.sizes?.map((size) => size.trim()).filter(Boolean);
    const safeSizes = sizes?.length ? sizes : ["One size"];
    const sizePrices = Object.fromEntries(
      Object.entries(product.sizePrices ?? {})
        .map(([size, price]) => [size.trim(), Number(price)] as const)
        .filter(([size, price]) => safeSizes.includes(size) && Number.isFinite(price) && price >= 0)
    );
    const fallbackPrice = Object.values(sizePrices)[0] ?? 0;
    const price = Number(product.price);
    const sizeMedia = Object.fromEntries(
      Object.entries(product.sizeMedia ?? {})
        .map(([size, media]) => {
          const imageUrl = typeof media?.imageUrl === "string" ? media.imageUrl.trim() : "";
          const videoUrl = typeof media?.videoUrl === "string" ? media.videoUrl.trim() : "";
          const imagePosition = typeof media?.imagePosition === "string" ? media.imagePosition.trim() : "";
          return [size.trim(), {
            ...(imageUrl ? { imageUrl } : {}),
            ...(videoUrl ? { videoUrl } : {}),
            ...(imagePosition ? { imagePosition } : {})
          }] as const;
        })
        .filter(([size, media]) => safeSizes.includes(size) && Object.keys(media).length)
    );

    return {
      ...product,
      category: product.category === "Body Care" ? "Skin Care" : product.category,
      imageUrl: VERIFIED_PRODUCT_IMAGES[product.id] ?? product.imageUrl,
      status: PRODUCTS_AWAITING_VERIFIED_MEDIA.has(product.id) ? "draft" : product.status,
      sizes: safeSizes,
      price: Number.isFinite(price) && price >= 0 ? price : fallbackPrice,
      sizePrices: Object.keys(sizePrices).length ? sizePrices : undefined,
      sizeMedia: Object.keys(sizeMedia).length ? sizeMedia : undefined
    };
  });
}

function defaultProducts() {
  return normalizeStoredProducts(platformSnapshot.products);
}

function productsOrDefaults(products: unknown): Product[] {
  if (!Array.isArray(products)) return defaultProducts();
  const normalizedProducts = normalizeStoredProducts(products as Product[]);
  return normalizedProducts.length ? normalizedProducts : defaultProducts();
}

function defaults(): StoreContent {
  return {
    products: defaultProducts(),
    media: sheaDefaultMediaConfig,
    pageOverrides: {},
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
      await sql`ALTER TABLE storefront_content ADD COLUMN IF NOT EXISTS page_overrides JSONB NOT NULL DEFAULT '{}'::jsonb`;
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
    SELECT products, media, page_overrides, updated_at
    FROM storefront_content
    WHERE store_key = ${STORE_KEY}
    LIMIT 1
  `;

  if (!rows.length) return defaults();
  return {
    products: productsOrDefaults(rows[0].products),
    media: sanitizeSheaMediaConfig(rows[0].media as SheaMediaConfig),
    pageOverrides: (rows[0].page_overrides as PageOverrides | null) ?? {},
    persisted: true,
    updatedAt: new Date(rows[0].updated_at as string).toISOString()
  };
}

export async function saveProducts(products: Product[]) {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured.");
  await ensureTable(sql);
  const safeProducts = normalizeStoredProducts(products);
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
    VALUES (${STORE_KEY}, ${JSON.stringify(defaultProducts())}::jsonb, ${JSON.stringify(safeMedia)}::jsonb)
    ON CONFLICT (store_key) DO UPDATE
    SET media = EXCLUDED.media, updated_at = NOW()
    RETURNING media, updated_at
  `;
  return {
    persisted: true,
    media: sanitizeSheaMediaConfig(rows[0].media as SheaMediaConfig),
    updatedAt: new Date(rows[0].updated_at as string).toISOString()
  };
}

export async function savePageOverrides(pageOverrides: PageOverrides) {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured.");
  await ensureTable(sql);
  const rows = await sql`
    INSERT INTO storefront_content (store_key, products, media, page_overrides)
    VALUES (${STORE_KEY}, ${JSON.stringify(defaultProducts())}::jsonb, ${JSON.stringify(sheaDefaultMediaConfig)}::jsonb, ${JSON.stringify(pageOverrides)}::jsonb)
    ON CONFLICT (store_key) DO UPDATE
    SET page_overrides = EXCLUDED.page_overrides, updated_at = NOW()
    RETURNING updated_at
  `;
  return { persisted: true, updatedAt: new Date(rows[0].updated_at as string).toISOString() };
}
