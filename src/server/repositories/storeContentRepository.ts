import { neon } from "@neondatabase/serverless";
import { platformSnapshot } from "@/lib/platform-data";
import {
  isLegacySheaMediaPath,
  replaceRetiredSyntheticImage,
  sanitizeSheaMediaConfig,
  sheaDefaultMediaConfig,
  type SheaMediaConfig
} from "@/lib/shea-content";
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
const PAGE_OVERRIDE_SCHEMA_KEY = "__shea_page_overrides_schema";
const PAGE_OVERRIDE_SCHEMA_VERSION = "3";
const PAGE_OVERRIDE_SCHEMA = { texts: { version: PAGE_OVERRIDE_SCHEMA_VERSION } };
const VERIFIED_PRODUCT_IMAGES: Record<string, string> = {
  prod_chebe_serum: "/assets/media-library/aug-2026/aug-2026-026.jpeg",
  prod_chebe_butter: "/assets/media-library/aug-2026/aug-2026-043.jpeg",
  prod_yellow_castor_oil: "/assets/media-library/aug-2026/aug-2026-028.jpeg",
  prod_essential_oils: "/assets/media-library/aug-2026/aug-2026-025.jpeg",
  prod_aromatherapy: "/assets/media-library/aug-2026/aug-2026-030.jpeg",
  prod_spa_essentials: "/assets/media-library/aug-2026/aug-2026-057.jpeg",
  prod_gift_set: "/assets/media-library/aug-2026/aug-2026-025.jpeg"
};

// These catalogue records previously displayed placeholders or a single jar as
// an unrelated bundle. They remain drafts only while that exact placeholder is
// attached, so an administrator can publish them after replacing it with a
// verified product image.
const UNVERIFIED_PRODUCT_IMAGES: Record<string, readonly string[]> = {
  prod_rosehip_facial_oil: ["/assets/shea-wellness-tree-logo.jpeg"],
  prod_cucumber_mint_sunscreen: ["/assets/shea-wellness-tree-logo.jpeg"],
  prod_baobab_oil: ["/assets/shea-wellness-tree-logo.jpeg"],
  prod_distributor_offer: ["/assets/sheawellness/lavender-shea-butter-lid.jpeg"]
};

function productNeedsVerifiedMedia(product: Product) {
  const imageUrl = typeof product.imageUrl === "string" ? replaceRetiredSyntheticImage(product.imageUrl.trim()) : "";
  return isLegacySheaMediaPath(imageUrl) || (UNVERIFIED_PRODUCT_IMAGES[product.id] ?? []).includes(imageUrl);
}

function sanitizePageOverrides(
  pageOverrides: PageOverrides | null | undefined,
  options: { acceptSubmittedImages?: boolean } = {}
): PageOverrides {
  if (!pageOverrides || typeof pageOverrides !== "object" || Array.isArray(pageOverrides)) {
    return { [PAGE_OVERRIDE_SCHEMA_KEY]: PAGE_OVERRIDE_SCHEMA };
  }

  // Version 3 excludes the shared header from page image indexes. Old
  // page-image overrides are index based and can silently put a historic
  // upload back into a completely different layout after a design update. Keep
  // legacy text so editors do not lose copy, but require the current schema
  // marker before an image override is allowed to affect the public site.
  const schemaEntry = pageOverrides[PAGE_OVERRIDE_SCHEMA_KEY];
  const acceptsImageOverrides = options.acceptSubmittedImages
    || schemaEntry?.texts?.version === PAGE_OVERRIDE_SCHEMA_VERSION;

  return {
    [PAGE_OVERRIDE_SCHEMA_KEY]: PAGE_OVERRIDE_SCHEMA,
    ...Object.fromEntries(
      Object.entries(pageOverrides).flatMap(([page, override]) => {
      if (page === PAGE_OVERRIDE_SCHEMA_KEY) return [];
      if (!override || typeof override !== "object") return [];
      const images = Object.fromEntries(
        Object.entries(override.images ?? {}).flatMap(([key, value]) => {
          if (typeof value !== "string") return [];
          const src = replaceRetiredSyntheticImage(value.trim());
          return acceptsImageOverrides && src && !isLegacySheaMediaPath(src) ? [[key, src]] : [];
        })
      );
      const safeOverride = {
        ...(override.texts ? { texts: override.texts } : {}),
        ...(Object.keys(images).length ? { images } : {})
      };

      return Object.keys(safeOverride).length ? [[page, safeOverride]] : [];
      })
    )
  };
}

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
          const imageUrl = typeof media?.imageUrl === "string" ? replaceRetiredSyntheticImage(media.imageUrl.trim()) : "";
          const videoUrl = typeof media?.videoUrl === "string" ? replaceRetiredSyntheticImage(media.videoUrl.trim()) : "";
          const imagePosition = typeof media?.imagePosition === "string" ? media.imagePosition.trim() : "";
          return [size.trim(), {
            ...(imageUrl && !isLegacySheaMediaPath(imageUrl) ? { imageUrl } : {}),
            ...(videoUrl && !isLegacySheaMediaPath(videoUrl) ? { videoUrl } : {}),
            ...(imagePosition ? { imagePosition } : {})
          }] as const;
        })
        .filter(([size, media]) => safeSizes.includes(size) && Object.keys(media).length)
    );

    return {
      ...product,
      category: product.category === "Body Care" ? "Skin Care" : product.category,
      imageUrl: isLegacySheaMediaPath(product.imageUrl)
        ? VERIFIED_PRODUCT_IMAGES[product.id] ?? replaceRetiredSyntheticImage(product.imageUrl)
        : replaceRetiredSyntheticImage(product.imageUrl),
      status: productNeedsVerifiedMedia(product) ? "draft" : product.status,
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
  return normalizedProducts;
}

function defaults(): StoreContent {
  return {
    products: defaultProducts(),
    media: sheaDefaultMediaConfig,
    pageOverrides: { [PAGE_OVERRIDE_SCHEMA_KEY]: PAGE_OVERRIDE_SCHEMA },
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
      await sql`ALTER TABLE storefront_content ADD COLUMN IF NOT EXISTS catalogue_initialized BOOLEAN NOT NULL DEFAULT FALSE`;
      // Migrate the old media-only record once. Subsequent intentional empty
      // catalogues stay empty; there is no repeating read-time seed fallback.
      await sql`
        UPDATE storefront_content
        SET products = CASE WHEN products = '[]'::jsonb THEN ${JSON.stringify(defaultProducts())}::jsonb ELSE products END,
          catalogue_initialized = TRUE
        WHERE store_key = ${STORE_KEY} AND catalogue_initialized = FALSE
      `;
      await sql`
        INSERT INTO storefront_content (store_key, products, media, catalogue_initialized)
        VALUES (${STORE_KEY}, ${JSON.stringify(defaultProducts())}::jsonb, ${JSON.stringify(sheaDefaultMediaConfig)}::jsonb, TRUE)
        ON CONFLICT (store_key) DO NOTHING
      `;
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  await tableReady;
}

export async function getStoreContent({ strict = false }: { strict?: boolean } = {}): Promise<StoreContent> {
  const sql = database();
  if (!sql) {
    if (strict) throw new Error("DATABASE_URL is not configured.");
    return defaults();
  }

  try {
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
      pageOverrides: sanitizePageOverrides(rows[0].page_overrides as PageOverrides | null),
      persisted: true,
      updatedAt: new Date(rows[0].updated_at as string).toISOString()
    };
  } catch (error) {
    if (strict) throw error;
    // Public browsing should remain available with the verified in-repo
    // catalogue when the optional content database is temporarily offline.
    // Admin writes and checkout persistence remain strict and still fail.
    console.error("Storefront content database unavailable; serving verified defaults.");
    return defaults();
  }
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
    -- Preserve media and page overrides already saved for this storefront.
    SET products = EXCLUDED.products, updated_at = NOW()
    RETURNING updated_at
  `;
  return { persisted: true, updatedAt: new Date(rows[0].updated_at as string).toISOString() };
}

export async function appendProduct(product: Product) {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured.");
  await ensureTable(sql);
  const safeProduct = normalizeStoredProducts([product])[0];
  await sql`
    INSERT INTO storefront_content (store_key, products, media)
    VALUES (${STORE_KEY}, ${JSON.stringify([...defaultProducts(), safeProduct])}::jsonb, ${JSON.stringify(sheaDefaultMediaConfig)}::jsonb)
    ON CONFLICT (store_key) DO UPDATE
    SET products = storefront_content.products || ${JSON.stringify([safeProduct])}::jsonb, updated_at = NOW()
  `;
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
    -- Preserve the catalogue and page overrides already saved for this storefront.
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
  // This payload has already passed the admin access guard. Accept its current
  // image selections and stamp them with the schema marker in one operation so
  // the very first image edit is not mistaken for a legacy index override.
  const safePageOverrides = sanitizePageOverrides(pageOverrides, { acceptSubmittedImages: true });
  const rows = await sql`
    INSERT INTO storefront_content (store_key, products, media, page_overrides)
    VALUES (${STORE_KEY}, ${JSON.stringify(defaultProducts())}::jsonb, ${JSON.stringify(sheaDefaultMediaConfig)}::jsonb, ${JSON.stringify(safePageOverrides)}::jsonb)
    ON CONFLICT (store_key) DO UPDATE
    -- Preserve the catalogue and media library already saved for this storefront.
    SET page_overrides = EXCLUDED.page_overrides, updated_at = NOW()
    RETURNING updated_at
  `;
  return { persisted: true, updatedAt: new Date(rows[0].updated_at as string).toISOString() };
}
