"use client";

import {
  BarChart3,
  BookOpen,
  Boxes,
  CheckCircle2,
  FileText,
  Image,
  LayoutDashboard,
  Leaf,
  Mail,
  Megaphone,
  PackagePlus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Users
} from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { formatMoney, titleCase } from "@/lib/format";
import {
  sheaBlogTopics,
  sheaBrand,
  sheaCatalogueDownload,
  replaceRetiredSyntheticImage,
  sanitizeSheaMediaConfig,
  sheaDefaultMediaConfig,
  sheaProductCategories,
  sheaQuality,
  sheaSocialProof,
  sheaSustainability,
  sheaWholesale
} from "@/lib/shea-content";
import type { PlatformSnapshot, Product, ProductStatus } from "@/lib/types";
import type { SheaHeroSlide, SheaMediaAsset, SheaMediaConfig } from "@/lib/shea-content";

const adminNav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Boxes },
  { id: "media", label: "Media library", icon: Image },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

const productFilters: Array<"all" | ProductStatus> = ["all", "active", "low_stock", "draft"];

type View = (typeof adminNav)[number]["id"];

type RuntimeOrder = {
  source?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  totalPrice: number;
  createdAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

type RuntimeReview = {
  source?: string;
  productId: string;
  name: string;
  rating: number;
  body: string;
  createdAt: string;
};

type ProductFormState = {
  id: string;
  title: string;
  description: string;
  category: string;
  badge: string;
  imageUrl: string;
  sizes: string;
  material: string;
  deliveryBadge: string;
  price: string;
  inventoryQty: string;
  status: ProductStatus;
};

type MediaSection = "hero" | "images" | "videos";

type MediaFormState = {
  id: string;
  title: string;
  src: string;
  tag: string;
  kicker: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  objectPosition: string;
};

function productToDraft(product?: Product): ProductFormState {
  return {
    id: product?.id ?? "",
    title: product?.title ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "Body Care",
    badge: product?.badge ?? "Shea Wellness",
    imageUrl: product?.imageUrl ?? "/assets/sheawellness/pure-raw-shea-butter.jpeg",
    sizes: product?.sizes.join(", ") ?? "100g, 250g, 500g",
    material: product?.material ?? "Raw Shea Butter",
    deliveryBadge: product?.deliveryBadge ?? "Handcrafted skincare",
    price: String(product?.price ?? 2000),
    inventoryQty: String(product?.inventoryQty ?? 24),
    status: product?.status ?? "draft"
  };
}

function mediaToDraft(asset?: SheaMediaAsset | SheaHeroSlide): MediaFormState {
  const heroAsset = asset as Partial<SheaHeroSlide>;

  return {
    id: asset?.id ?? "",
    title: asset?.title ?? "",
    src: asset?.src ?? "/assets/WhatsApp Image 2026-07-08 at 11.48.35.jpeg",
    tag: asset?.tag ?? "Skin routine",
    kicker: heroAsset.kicker ?? "Before and after",
    body: heroAsset.body ?? "Show the customer care journey with real Shea Wellness media.",
    ctaLabel: heroAsset.ctaLabel ?? "Shop routines",
    ctaHref: heroAsset.ctaHref ?? "/shop",
    objectPosition: asset?.objectPosition ?? "50% 50%"
  };
}

async function uploadAdminImage(file: File) {
  const form = new FormData();
  form.set("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body: form });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Unable to upload image.");
  return payload.data.url as string;
}

export function AdminShell({ snapshot }: { snapshot: PlatformSnapshot }) {
  const [view, setView] = useState<View>("overview");
  const [createProductRequest, setCreateProductRequest] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof productFilters)[number]>("all");
  const [managedProducts, setManagedProducts] = useState<Product[]>(snapshot.products);
  const [runtimeOrders, setRuntimeOrders] = useState<RuntimeOrder[]>([]);
  const [runtimeReviews, setRuntimeReviews] = useState<RuntimeReview[]>([]);
  const [mediaConfig, setMediaConfig] = useState<SheaMediaConfig>(sheaDefaultMediaConfig);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "saving" | "error" | "setup">("loading");
  const [saveMessage, setSaveMessage] = useState("Connecting to content database…");
  const activeStore = snapshot.activeStore;

  const filteredProducts = useMemo(() => {
    return managedProducts.filter((product) => {
      const text = `${product.title} ${product.category} ${product.description}`.toLowerCase();
      const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
      const matchesFilter = filter === "all" || product.status === filter;
      return product.storeId === activeStore.id && matchesQuery && matchesFilter;
    });
  }, [activeStore.id, filter, managedProducts, query]);

  useEffect(() => {
    const savedOrders = JSON.parse(window.localStorage.getItem("sheaWellnessOrders") ?? "[]") as RuntimeOrder[];
    const savedReviews = JSON.parse(window.localStorage.getItem("sheaWellnessReviews") ?? "[]") as RuntimeReview[];
    setRuntimeOrders(savedOrders.filter((order) => order.source === "shea_storefront_checkout"));
    setRuntimeReviews(savedReviews.filter((review) => review.source === "shea_storefront_review"));

    void fetch("/api/admin/content", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load content.");
        setManagedProducts((payload.data.products as Product[]).map((product) => ({ ...product, imageUrl: replaceRetiredSyntheticImage(product.imageUrl) })));
        setMediaConfig(sanitizeSheaMediaConfig(payload.data.media as SheaMediaConfig));
        setSaveState(payload.data.persisted ? "saved" : "setup");
        setSaveMessage(payload.data.persisted ? "All changes are synced to Neon" : "Add DATABASE_URL to enable saving");
      })
      .catch((error: Error) => {
        setSaveState("error");
        setSaveMessage(error.message);
      });
  }, []);

  async function persistContent(body: object) {
    setSaveState("saving");
    setSaveMessage("Saving changes…");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save changes.");
      setSaveState("saved");
      setSaveMessage("Saved to Neon");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Unable to save changes.");
    }
  }

  function saveManagedProducts(nextProducts: Product[]) {
    setManagedProducts(nextProducts);
    void persistContent({ type: "products", products: nextProducts });
  }

  function saveMediaConfig(nextMediaConfig: SheaMediaConfig) {
    setMediaConfig(nextMediaConfig);
    void persistContent({ type: "media", media: nextMediaConfig });
  }

  function openNewProduct() {
    setView("products");
    setCreateProductRequest((request) => request + 1);
  }

  const adminOrders = runtimeOrders;

  return (
    <div className="shea-admin">
      <aside className="shea-admin-sidebar">
        <div className="shea-admin-brand">
          <div>S</div>
          <span>Shea Wellness LTD</span>
          <small>Store administration</small>
        </div>

        <nav aria-label="Shea Wellness admin navigation">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <button type="button" key={item.id} className={clsx(view === item.id && "active")} onClick={() => setView(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <a className="shea-admin-store-link" href="/" target="_blank" rel="noreferrer">View live store</a>
      </aside>

      <main className="shea-admin-main">
        <header className="shea-admin-topbar">
          <label>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Shea products, orders, buyers" />
          </label>
          <span className={clsx("shea-admin-sync", saveState)}>
            <i aria-hidden="true" />
            {saveMessage}
          </span>
          <button type="button" onClick={openNewProduct}><PackagePlus size={17} /> Add product</button>
        </header>

        {view === "overview" ? <OverviewView snapshot={snapshot} products={filteredProducts} orders={adminOrders} reviews={runtimeReviews} mediaConfig={mediaConfig} setView={setView} /> : null}
        {view === "orders" ? <OrdersView snapshot={snapshot} orders={adminOrders} /> : null}
        {view === "products" ? <ProductsView products={filteredProducts} allProducts={managedProducts} storeId={activeStore.id} filter={filter} setFilter={setFilter} saveProducts={saveManagedProducts} createRequest={createProductRequest} mediaConfig={mediaConfig} saveMediaConfig={saveMediaConfig} /> : null}
        {view === "media" ? <MediaView mediaConfig={mediaConfig} saveMediaConfig={saveMediaConfig} /> : null}
        {view === "settings" ? <SettingsView snapshot={snapshot} /> : null}
      </main>
    </div>
  );
}

function OverviewView({
  snapshot,
  products,
  orders,
  reviews,
  mediaConfig,
  setView
}: {
  snapshot: PlatformSnapshot;
  products: PlatformSnapshot["products"];
  orders: RuntimeOrder[];
  reviews: RuntimeReview[];
  mediaConfig: SheaMediaConfig;
  setView: (view: View) => void;
}) {
  return (
    <section className="shea-admin-stack">
      <AdminHeading
        eyebrow="Dashboard"
        title="Welcome back"
        action={<button className="shea-admin-primary-action" onClick={() => setView("products")}><PackagePlus size={17} /> Add product</button>}
      />

      <div className="shea-admin-metrics">
        {[
          { label: "Products", value: String(products.length), detail: "In your catalogue" },
          { label: "Orders", value: String(orders.length), detail: "Captured orders" },
          { label: "Reviews", value: String(reviews.length), detail: "Customer feedback" },
          { label: "Sales", value: formatMoney(orders.reduce((sum, order) => sum + order.totalPrice, 0), snapshot.activeStore.currency), detail: "Gross sales" }
        ].map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </div>

      <section className="shea-admin-grid two shea-admin-home-panels">
        <Panel title="Recent products" description="Your latest catalogue items." action={<button onClick={() => setView("products")}>View all</button>}>
          <ProductTable products={products.slice(0, 5)} currency={snapshot.activeStore.currency} />
        </Panel>
        <Panel title="Media library" description={`${mediaConfig.images.length} images and ${mediaConfig.videos.length} videos available.`} action={<button onClick={() => setView("media")}>Open library</button>}>
          <div className="shea-admin-media-preview">
            {mediaConfig.images.slice(0, 6).map((asset) => <img key={asset.id} src={asset.src} alt={asset.title} />)}
          </div>
        </Panel>
      </section>
    </section>
  );
}

function ProductsView({
  products,
  allProducts,
  storeId,
  filter,
  setFilter,
  saveProducts,
  createRequest,
  mediaConfig,
  saveMediaConfig
}: {
  products: PlatformSnapshot["products"];
  allProducts: PlatformSnapshot["products"];
  storeId: string;
  filter: (typeof productFilters)[number];
  setFilter: (filter: (typeof productFilters)[number]) => void;
  saveProducts: (products: Product[]) => void;
  createRequest: number;
  mediaConfig: SheaMediaConfig;
  saveMediaConfig: (mediaConfig: SheaMediaConfig) => void;
}) {
  const [draft, setDraft] = useState<ProductFormState>(() => productToDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUploadState, setImageUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [imageUploadMessage, setImageUploadMessage] = useState("Choose a JPG, PNG, WebP, GIF, or AVIF image up to 10 MB.");
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const productEditorRef = useRef<HTMLDivElement | null>(null);
  const categoryOptions = Array.from(new Set([...allProducts.map((product) => product.category), "Body Care", "Face Care", "Hair Care", "Essential Oils"]));

  function updateDraft(field: keyof ProductFormState, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setDraft(productToDraft());
    window.setTimeout(() => productEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  useEffect(() => {
    if (createRequest > 0) startCreate();
  }, [createRequest]);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setDraft(productToDraft(product));
    window.setTimeout(() => productEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function uploadProductImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploadState("uploading");
    setImageUploadMessage(`Uploading ${file.name}…`);
    try {
      const imageUrl = await uploadAdminImage(file);
      updateDraft("imageUrl", imageUrl);
      if (!mediaConfig.images.some((asset) => asset.src === imageUrl)) {
        saveMediaConfig({
          ...mediaConfig,
          images: [...mediaConfig.images, { id: `image_${Date.now()}`, title: file.name.replace(/\.[^.]+$/, ""), src: imageUrl, type: "image", tag: "Product image", objectPosition: "50% 50%" }]
        });
      }
      setImageUploadState("idle");
      setImageUploadMessage("Upload complete. Save the product to publish this image.");
    } catch (error) {
      setImageUploadState("error");
      setImageUploadMessage(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      event.target.value = "";
    }
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const existingProduct = allProducts.find((product) => product.id === editingId);
    const productId = existingProduct?.id ?? `prod_${Date.now()}`;
    const parsedSizes = draft.sizes.split(",").map((size) => size.trim()).filter(Boolean);
    const nextProduct: Product = {
      id: productId,
      storeId,
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category.trim() || "Body Care",
      badge: draft.badge.trim() || "Shea Wellness",
      imageUrl: draft.imageUrl.trim() || "/assets/sheawellness/pure-raw-shea-butter.jpeg",
      imagePosition: existingProduct?.imagePosition ?? "50% 50%",
      rating: existingProduct?.rating ?? 0,
      reviewCount: existingProduct?.reviewCount ?? 0,
      colors: [],
      sizes: parsedSizes.length ? parsedSizes : ["100g"],
      material: draft.material.trim() || "Raw Shea Butter",
      deliveryBadge: draft.deliveryBadge.trim() || "Handcrafted skincare",
      price: Number(draft.price) || 0,
      sizePrices: existingProduct?.sizePrices,
      inventoryQty: Number(draft.inventoryQty) || 0,
      status: draft.status,
      channel: existingProduct?.channel ?? "both",
      sales: existingProduct?.sales ?? 0
    };

    const nextProducts = existingProduct
      ? allProducts.map((product) => (product.id === existingProduct.id ? nextProduct : product))
      : [nextProduct, ...allProducts];

    saveProducts(nextProducts);
    setEditingId(nextProduct.id);
    setDraft(productToDraft(nextProduct));
  }

  function deleteProduct(productId: string) {
    const confirmed = window.confirm("Remove this product from the Shea Wellness storefront?");
    if (!confirmed) return;

    saveProducts(allProducts.filter((product) => product.id !== productId));
    if (editingId === productId) {
      startCreate();
    }
  }

  return (
    <section className="shea-admin-stack">
      <AdminHeading
        eyebrow="Products"
        title="Manage your catalogue"
        action={<button type="button" className="shea-admin-primary-action" onClick={startCreate}><PackagePlus size={17} /> Add new product</button>}
      />
      <div className="shea-admin-catalogue-tools">
        <div>
          <strong>{allProducts.length} products</strong>
          <span>{products.length === allProducts.length ? "All products are shown" : `${products.length} match your search and filter`}</span>
        </div>
        <ProductFilter filter={filter} setFilter={setFilter} />
      </div>
      <section className="shea-admin-grid wide-left">
        <Panel title="Product list" description="Edit a product or remove it from the storefront.">
          {products.length ? (
            <ProductTable products={products} currency="KES" onEdit={startEdit} onDelete={deleteProduct} />
          ) : (
            <div className="shea-admin-empty">
              <Boxes size={28} />
              <strong>No products found</strong>
              <p>Try another search or filter, or add a new product.</p>
              <button type="button" onClick={startCreate}>Add product</button>
            </div>
          )}
        </Panel>
        <Panel
          title={editingId ? "Modify product" : "Add product"}
          description="Changes save to Neon and publish to the customer storefront."
          action={<button type="button" onClick={startCreate}>New product</button>}
        >
          <div ref={productEditorRef} className="shea-admin-editor-anchor">
          <div className="shea-admin-editing-banner" aria-live="polite">
            <span>{editingId ? "Editing product" : "Creating product"}</span>
            <strong>{editingId ? draft.title : "New storefront product"}</strong>
          </div>
          <form className="shea-admin-product-form" onSubmit={saveDraft}>
            <label>
              Product name
              <input required value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="Lavender Shea Body Butter" />
            </label>
            <label>
              Description
              <textarea required value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Short storefront product description" />
            </label>
            <div className="shea-admin-form-row">
              <label>
                Category
                <select value={draft.category} onChange={(event) => updateDraft("category", event.target.value)}>
                  {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label>
                Status
                <select value={draft.status} onChange={(event) => updateDraft("status", event.target.value as ProductStatus)}>
                  {productFilters.filter((item) => item !== "all").map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
              </label>
            </div>
            <div className="shea-admin-form-row">
              <label>
                Price
                <input required type="number" min="0" value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} />
              </label>
              <label>
                Inventory
                <input required type="number" min="0" value={draft.inventoryQty} onChange={(event) => updateDraft("inventoryQty", event.target.value)} />
              </label>
            </div>
            <div className="shea-admin-image-field">
              <span>Product image</span>
              {draft.imageUrl ? <img src={draft.imageUrl} alt="Selected product" /> : null}
              <div>
                <button type="button" onClick={() => setIsMediaLibraryOpen(true)}><Image size={16} /> Choose from media library</button>
                <small>Pick an existing image or upload a new one below.</small>
              </div>
            </div>
            <label className={`shea-admin-upload ${imageUploadState}`}>
              <span>{imageUploadState === "uploading" ? "Uploading image…" : "Upload from computer"}</span>
              <small>{imageUploadMessage}</small>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={uploadProductImage} disabled={imageUploadState === "uploading"} />
            </label>
            {draft.imageUrl ? <img className="shea-admin-upload-preview" src={draft.imageUrl} alt="Product upload preview" /> : null}
            <details className="shea-admin-advanced-fields">
              <summary>More product details <span>Optional</span></summary>
              <div>
                <label>
                  Sizes
                  <input value={draft.sizes} onChange={(event) => updateDraft("sizes", event.target.value)} placeholder="100g, 250g, 500g" />
                </label>
                <label>
                  Ingredients / material
                  <input value={draft.material} onChange={(event) => updateDraft("material", event.target.value)} />
                </label>
                <label>
                  Storefront badge
                  <input value={draft.deliveryBadge} onChange={(event) => updateDraft("deliveryBadge", event.target.value)} />
                </label>
              </div>
            </details>
            <button type="submit">{editingId ? "Save product changes" : "Create product"}</button>
          </form>
          </div>
        </Panel>
      </section>
      {isMediaLibraryOpen ? (
        <MediaLibraryPicker
          assets={[
            ...mediaConfig.heroSlides,
            ...mediaConfig.images,
            ...allProducts.map((product) => ({ id: `product_${product.id}`, title: product.title, src: product.imageUrl, type: "image" as const, tag: "Product image" }))
          ]}
          selectedSrc={draft.imageUrl}
          onClose={() => setIsMediaLibraryOpen(false)}
          onSelect={(src) => {
            updateDraft("imageUrl", src);
            setIsMediaLibraryOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

function MediaLibraryPicker({
  assets,
  selectedSrc,
  onSelect,
  onClose
}: {
  assets: Array<SheaMediaAsset | SheaHeroSlide>;
  selectedSrc: string;
  onSelect: (src: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const uniqueAssets = Array.from(new Map(assets.filter((asset) => asset.type === "image").map((asset) => [asset.src, asset])).values());
  const visibleAssets = uniqueAssets.filter((asset) => `${asset.title} ${asset.tag}`.toLowerCase().includes(search.trim().toLowerCase()));

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="shea-media-picker-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="shea-media-picker" role="dialog" aria-modal="true" aria-labelledby="media-library-title">
        <header>
          <div><span>Media</span><h2 id="media-library-title">Choose an image</h2></div>
          <button type="button" onClick={onClose} aria-label="Close media library">×</button>
        </header>
        <div className="shea-media-picker-tools">
          <label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search media library" autoFocus /></label>
          <strong>{visibleAssets.length} images</strong>
        </div>
        <div className="shea-media-picker-grid">
          {visibleAssets.map((asset) => (
            <button type="button" key={asset.src} className={clsx(asset.src === selectedSrc && "selected")} onClick={() => onSelect(asset.src)} title={asset.title}>
              <img src={asset.src} alt={asset.title} />
              <span>{asset.title}</span>
            </button>
          ))}
        </div>
        {!visibleAssets.length ? <div className="shea-admin-empty"><Image size={28} /><strong>No images found</strong><p>Try a different search.</p></div> : null}
      </section>
    </div>
  );
}

function ReviewsView({ products, reviews }: { products: PlatformSnapshot["products"]; reviews: RuntimeReview[] }) {
  return (
    <section className="shea-admin-stack">
      <AdminHeading eyebrow="Customers" title="Product review center" />
      <Panel title="Storefront reviews" description="Real reviews submitted from the product quick-view form in this browser session.">
        {reviews.length ? (
          <div className="shea-admin-list reviews">
            {reviews.map((review) => {
              const product = products.find((item) => item.id === review.productId);
              return (
                <article key={`${review.productId}-${review.createdAt}`}>
                  <div>
                    <strong>{product?.title ?? "Product"}</strong>
                    <span>{review.name} - {new Date(review.createdAt).toLocaleDateString()}</span>
                    <p>{review.body}</p>
                  </div>
                  <strong>{review.rating}/5</strong>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="shea-admin-empty">
            <Star size={28} />
            <strong>No customer reviews yet</strong>
            <p>Reviews submitted on product pages will appear here for Shea Wellness admin review.</p>
          </div>
        )}
      </Panel>
    </section>
  );
}

function OrdersView({ snapshot, orders }: { snapshot: PlatformSnapshot; orders: RuntimeOrder[] }) {
  return (
    <section className="shea-admin-stack">
      <AdminHeading eyebrow="Operations" title="Orders and fulfillment" />
      <section className="shea-admin-grid three">
        {["unfulfilled", "partial", "on_hold"].map((status) => (
          <Panel key={status} title={titleCase(status)} description="Operational work queue.">
            <div className="shea-admin-list">
              {orders
                .filter((order) => order.fulfillmentStatus === status)
                .map((order) => (
                  <article key={`${order.orderNumber}-${order.createdAt}`}>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <span>{order.customerName}</span>
                    </div>
                    <strong>{formatMoney(order.totalPrice, snapshot.activeStore.currency)}</strong>
                  </article>
                ))}
            </div>
          </Panel>
        ))}
      </section>
    </section>
  );
}

function WholesaleView() {
  return (
    <section className="shea-admin-stack">
      <AdminHeading eyebrow="Growth" title="Wholesale and distributor management" />
      <section className="shea-admin-grid two">
        <Panel title="Partner channels" description="Critical buyer segments from the content plan.">
          <Checklist items={sheaWholesale.partners} icon={<Users size={17} />} />
        </Panel>
        <Panel title="Retailer value proposition" description="Why buyers should choose Shea Wellness.">
          <Checklist items={sheaWholesale.reasons} icon={<Truck size={17} />} />
        </Panel>
      </section>
      <Panel title="Wholesale pipeline" description="Representative lead board for international buyers and spa accounts.">
        <div className="shea-admin-pipeline">
          {["New catalogue request", "Samples sent", "Pricing review", "Distributor onboarding"].map((stage, index) => (
            <article key={stage}>
              <span>{stage}</span>
              <strong>{[18, 11, 7, 4][index]} accounts</strong>
              <small>{["Retailers and spas", "Organic beauty stores", "Private label buyers", "Export buyers"][index]}</small>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function ContentView() {
  return (
    <section className="shea-admin-stack">
      <AdminHeading eyebrow="Website CMS" title="Content coverage from the DOCX" />
      <section className="shea-admin-grid two">
        <Panel title="Live public pages" description="Every requested website tab has a route.">
          <Checklist items={["Home: /", "About: /about", "Products: /products", "Wholesale: /wholesale", "Sustainability: /sustainability", "Blog: /blog", "Quality: /quality", "Contact: /contact", "Catalogue: /catalogue"]} icon={<CheckCircle2 size={17} />} />
        </Panel>
        <Panel title="Blog topics" description="Wellness education topics ready for article publishing.">
          <Checklist items={sheaBlogTopics} icon={<BookOpen size={17} />} />
        </Panel>
      </section>
      <Panel title="Social proof modules" description="Instagram, testimonials, expo participation, and media mentions.">
        <div className="shea-admin-grid four compact">
          {sheaSocialProof.map((item) => (
            <MiniPanel key={item.title} icon={<Megaphone size={20} />} title={item.title} body={item.body} />
          ))}
        </div>
      </Panel>
    </section>
  );
}

function QualityView() {
  return (
    <section className="shea-admin-stack">
      <AdminHeading eyebrow="Quality and sustainability" title="Export confidence controls" />
      <section className="shea-admin-grid two">
        <Panel title="Quality standards" description="Certification and quality page content.">
          <Checklist items={sheaQuality} icon={<ShieldCheck size={17} />} />
        </Panel>
        <Panel title="Sustainability commitments" description="Sourcing and impact story.">
          <Checklist items={sheaSustainability} icon={<Leaf size={17} />} />
        </Panel>
      </section>
      <Panel title="Catalogue CTA" description="Download area prepared for the supplied catalogue file.">
        <div className="shea-admin-callout">
          <FileText size={22} />
          <div>
            <strong>{sheaCatalogueDownload.title}</strong>
            <p>{sheaCatalogueDownload.body}</p>
          </div>
        </div>
      </Panel>
    </section>
  );
}

function MediaView({
  mediaConfig,
  saveMediaConfig
}: {
  mediaConfig: SheaMediaConfig;
  saveMediaConfig: (mediaConfig: SheaMediaConfig) => void;
}) {
  const [section, setSection] = useState<MediaSection>("hero");
  const [draft, setDraft] = useState<MediaFormState>(() => mediaToDraft(mediaConfig.heroSlides[0]));
  const [editingId, setEditingId] = useState<string | null>(mediaConfig.heroSlides[0]?.id ?? null);
  const [imageUploadState, setImageUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [imageUploadMessage, setImageUploadMessage] = useState("Upload an image from this computer or keep using a hosted URL.");
  const mediaEditorRef = useRef<HTMLDivElement | null>(null);

  const activeItems = section === "hero" ? mediaConfig.heroSlides : section === "images" ? mediaConfig.images : mediaConfig.videos;

  function updateDraft(field: keyof MediaFormState, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function switchSection(nextSection: MediaSection) {
    const nextItems = nextSection === "hero" ? mediaConfig.heroSlides : nextSection === "images" ? mediaConfig.images : mediaConfig.videos;
    setSection(nextSection);
    setEditingId(nextItems[0]?.id ?? null);
    setDraft(mediaToDraft(nextItems[0]));
  }

  function startCreate() {
    setEditingId(null);
    setDraft(mediaToDraft());
    window.setTimeout(() => mediaEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function startEdit(asset: SheaMediaAsset | SheaHeroSlide) {
    setEditingId(asset.id);
    setDraft(mediaToDraft(asset));
    window.setTimeout(() => mediaEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function uploadMediaImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploadState("uploading");
    setImageUploadMessage(`Uploading ${file.name}…`);
    try {
      const imageUrl = await uploadAdminImage(file);
      updateDraft("src", imageUrl);
      setImageUploadState("idle");
      setImageUploadMessage("Upload complete. Save the media entry to publish it.");
    } catch (error) {
      setImageUploadState("error");
      setImageUploadMessage(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      event.target.value = "";
    }
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mediaId = editingId ?? `${section}_${Date.now()}`;

    if (section === "hero") {
      const nextSlide: SheaHeroSlide = {
        id: mediaId,
        title: draft.title.trim() || "Before and after Shea Wellness routine",
        src: draft.src.trim(),
        type: "image",
        tag: draft.tag.trim() || "Before and after",
        kicker: draft.kicker.trim() || "Before and after",
        body: draft.body.trim(),
        ctaLabel: draft.ctaLabel.trim() || "Shop routines",
        ctaHref: draft.ctaHref.trim() || "/shop",
        objectPosition: draft.objectPosition.trim() || "50% 50%"
      };
      const nextSlides = editingId
        ? mediaConfig.heroSlides.map((slide) => (slide.id === editingId ? nextSlide : slide))
        : [...mediaConfig.heroSlides, nextSlide];
      saveMediaConfig({ ...mediaConfig, heroSlides: nextSlides });
      setEditingId(nextSlide.id);
      setDraft(mediaToDraft(nextSlide));
      return;
    }

    const nextAsset: SheaMediaAsset = {
      id: mediaId,
      title: draft.title.trim() || (section === "images" ? "Shea Wellness image" : "Shea Wellness video"),
      src: draft.src.trim(),
      type: section === "images" ? "image" : "video",
      tag: draft.tag.trim() || "Brand media",
      objectPosition: draft.objectPosition.trim() || "50% 50%"
    };
    const listKey = section === "images" ? "images" : "videos";
    const nextItems = editingId
      ? mediaConfig[listKey].map((item) => (item.id === editingId ? nextAsset : item))
      : [...mediaConfig[listKey], nextAsset];
    saveMediaConfig({ ...mediaConfig, [listKey]: nextItems });
    setEditingId(nextAsset.id);
    setDraft(mediaToDraft(nextAsset));
  }

  function deleteMedia(mediaId: string) {
    const confirmed = window.confirm("Remove this media entry from the Shea Wellness site?");
    if (!confirmed) return;

    if (section === "hero") {
      const nextSlides = mediaConfig.heroSlides.filter((slide) => slide.id !== mediaId);
      saveMediaConfig({ ...mediaConfig, heroSlides: nextSlides });
      setEditingId(nextSlides[0]?.id ?? null);
      setDraft(mediaToDraft(nextSlides[0]));
      return;
    }

    const listKey = section === "images" ? "images" : "videos";
    const nextItems = mediaConfig[listKey].filter((item) => item.id !== mediaId);
    saveMediaConfig({ ...mediaConfig, [listKey]: nextItems });
    setEditingId(nextItems[0]?.id ?? null);
    setDraft(mediaToDraft(nextItems[0]));
  }

  function moveHeroSlide(mediaId: string, direction: -1 | 1) {
    const currentIndex = mediaConfig.heroSlides.findIndex((slide) => slide.id === mediaId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= mediaConfig.heroSlides.length) return;

    const nextSlides = [...mediaConfig.heroSlides];
    const [slide] = nextSlides.splice(currentIndex, 1);
    nextSlides.splice(nextIndex, 0, slide);
    saveMediaConfig({ ...mediaConfig, heroSlides: nextSlides });
  }

  function resetMedia() {
    const confirmed = window.confirm("Reset all Shea Wellness media entries to the default site media?");
    if (!confirmed) return;
    saveMediaConfig(sheaDefaultMediaConfig);
    setSection("hero");
    setEditingId(sheaDefaultMediaConfig.heroSlides[0]?.id ?? null);
    setDraft(mediaToDraft(sheaDefaultMediaConfig.heroSlides[0]));
  }

  return (
    <section className="shea-admin-stack">
      <AdminHeading
        eyebrow="Brand media"
        title="Editable storefront media"
        action={<button type="button" onClick={resetMedia}>Reset defaults</button>}
      />
      <div className="shea-admin-segments">
        {(["hero", "images", "videos"] as MediaSection[]).map((item) => (
          <button key={item} type="button" className={clsx(section === item && "active")} onClick={() => switchSection(item)}>
            {item === "hero" ? "Before/after carousel" : titleCase(item)}
          </button>
        ))}
      </div>
      <section className="shea-admin-grid wide-left">
        <Panel
          title={section === "hero" ? "Before/after carousel" : section === "images" ? "Image library" : "Video library"}
          description="Every entry here is editable and saved to the live Neon-backed storefront."
          action={<button type="button" onClick={startCreate}>Add media</button>}
        >
          <div className={section === "videos" ? "shea-admin-video-grid" : "shea-admin-media-grid"}>
            {activeItems.map((asset) => (
              <article key={asset.id}>
                {asset.type === "video" ? (
                  <video src={asset.src} muted loop playsInline preload="metadata" />
                ) : (
                  <img src={asset.src} alt={asset.title} style={{ objectPosition: asset.objectPosition ?? "50% 50%" }} />
                )}
                <span>{asset.tag}</span>
                <strong>{asset.title}</strong>
                <div className="shea-admin-table-actions">
                  <button type="button" onClick={() => startEdit(asset)}>Edit</button>
                  {section === "hero" ? <button type="button" onClick={() => moveHeroSlide(asset.id, -1)}>Up</button> : null}
                  {section === "hero" ? <button type="button" onClick={() => moveHeroSlide(asset.id, 1)}>Down</button> : null}
                  <button type="button" className="danger" onClick={() => deleteMedia(asset.id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
        <Panel
          title={editingId ? "Edit media" : "Add media"}
          description="Use public paths like /assets/file.jpeg or paste a full hosted media URL."
        >
          <div ref={mediaEditorRef} className="shea-admin-editor-anchor">
          <div className="shea-admin-editing-banner" aria-live="polite">
            <span>{editingId ? "Editing media" : "Creating media"}</span>
            <strong>{editingId ? draft.title : "New media entry"}</strong>
          </div>
          <form className="shea-admin-product-form" onSubmit={saveDraft}>
            <label>
              Title
              <input required value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} />
            </label>
            <label>
              Media URL
              <input required value={draft.src} onChange={(event) => updateDraft("src", event.target.value)} />
            </label>
            {section !== "videos" ? (
              <>
                <label className={`shea-admin-upload ${imageUploadState}`}>
                  <span>{imageUploadState === "uploading" ? "Uploading image…" : "Upload from computer"}</span>
                  <small>{imageUploadMessage}</small>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={uploadMediaImage} disabled={imageUploadState === "uploading"} />
                </label>
                {draft.src ? <img className="shea-admin-upload-preview" src={draft.src} alt="Media upload preview" /> : null}
              </>
            ) : null}
            <div className="shea-admin-form-row">
              <label>
                Tag
                <input value={draft.tag} onChange={(event) => updateDraft("tag", event.target.value)} />
              </label>
              <label>
                Object position
                <input value={draft.objectPosition} onChange={(event) => updateDraft("objectPosition", event.target.value)} placeholder="50% 50%" />
              </label>
            </div>
            {section === "hero" ? (
              <>
                <label>
                  Kicker
                  <input value={draft.kicker} onChange={(event) => updateDraft("kicker", event.target.value)} />
                </label>
                <label>
                  Slide body
                  <textarea value={draft.body} onChange={(event) => updateDraft("body", event.target.value)} />
                </label>
                <div className="shea-admin-form-row">
                  <label>
                    CTA label
                    <input value={draft.ctaLabel} onChange={(event) => updateDraft("ctaLabel", event.target.value)} />
                  </label>
                  <label>
                    CTA href
                    <input value={draft.ctaHref} onChange={(event) => updateDraft("ctaHref", event.target.value)} />
                  </label>
                </div>
              </>
            ) : null}
            <button type="submit">{editingId ? "Save media changes" : "Create media"}</button>
          </form>
          </div>
        </Panel>
      </section>
    </section>
  );
}

function SettingsView({ snapshot }: { snapshot: PlatformSnapshot }) {
  const [wellnessGuidesEnabled, setWellnessGuidesEnabled] = useState(false);

  useEffect(() => {
    setWellnessGuidesEnabled(window.localStorage.getItem("sheaWellnessHomepageGuidesEnabled") === "true");
  }, []);

  function updateWellnessGuidesVisibility(enabled: boolean) {
    setWellnessGuidesEnabled(enabled);
    window.localStorage.setItem("sheaWellnessHomepageGuidesEnabled", String(enabled));
    window.dispatchEvent(new Event("sheaWellnessSettingsChanged"));
  }

  return (
    <section className="shea-admin-stack">
      <AdminHeading eyebrow="Configuration" title="Shea Wellness store settings" />
      <section className="shea-admin-grid two">
        <Panel title="Store identity" description="This dashboard is scoped to Shea Wellness only.">
          <Detail label="Store" value={snapshot.activeStore.name} />
          <Detail label="Platform domain" value={snapshot.activeStore.platformDomain} />
          <Detail label="Plan" value={titleCase(snapshot.activeStore.plan)} />
          <Detail label="Currency" value={snapshot.activeStore.currency} />
        </Panel>
        <Panel title="Contact details" description="Business enquiries welcome.">
          <Detail label="Email" value={sheaBrand.email} />
          <Detail label="Phone" value={sheaBrand.phone} />
          <Detail label="Address" value={sheaBrand.address} />
          <Detail label="Products indexed" value={String(sheaProductCategories.reduce((total, category) => total + category.products.length, 0))} />
        </Panel>
        <Panel title="Homepage sections" description="Only administrators can control optional storefront content.">
          <label className="shea-admin-setting-toggle">
            <span>
              <strong>Wellness guides feature</strong>
              <small>{wellnessGuidesEnabled ? "Visible on the homepage" : "Hidden from the homepage"}</small>
            </span>
            <input
              type="checkbox"
              checked={wellnessGuidesEnabled}
              onChange={(event) => updateWellnessGuidesVisibility(event.target.checked)}
              aria-label="Show wellness guides feature on homepage"
            />
            <i aria-hidden="true" />
          </label>
        </Panel>
      </section>
    </section>
  );
}

function AdminHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="shea-admin-heading">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}

function Panel({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="shea-admin-panel">
      <div className="shea-admin-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MiniPanel({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="shea-admin-mini">
      {icon}
      <strong>{title}</strong>
      <p>{body}</p>
    </article>
  );
}

function Checklist({ items, icon }: { items: string[]; icon: ReactNode }) {
  return (
    <div className="shea-admin-checklist">
      {items.map((item) => (
        <article key={item}>
          {icon}
          <strong>{item}</strong>
        </article>
      ))}
    </div>
  );
}

function ProductFilter({
  filter,
  setFilter
}: {
  filter: (typeof productFilters)[number];
  setFilter: (filter: (typeof productFilters)[number]) => void;
}) {
  return (
    <div className="shea-admin-segments">
      {productFilters.map((item) => (
        <button key={item} type="button" className={clsx(filter === item && "active")} onClick={() => setFilter(item)}>
          {titleCase(item)}
        </button>
      ))}
    </div>
  );
}

function ProductTable({
  products,
  currency,
  onEdit,
  onDelete
}: {
  products: PlatformSnapshot["products"];
  currency: string;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}) {
  return (
    <div className="shea-admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Status</th>
            <th>Inventory</th>
            <th>Price</th>
            <th>Sales</th>
            {onEdit || onDelete ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="shea-admin-product-cell">
                  <img src={product.imageUrl} alt="" />
                  <div>
                    <strong>{product.title}</strong>
                    <small>{product.deliveryBadge}</small>
                  </div>
                </div>
              </td>
              <td>{product.category}</td>
              <td><span className={clsx("shea-admin-status", product.status)}>{titleCase(product.status)}</span></td>
              <td>{product.inventoryQty}</td>
              <td>{formatMoney(product.price, currency)}</td>
              <td>{product.sales}</td>
              {onEdit || onDelete ? (
                <td>
                  <div className="shea-admin-table-actions">
                    {onEdit ? <button type="button" onClick={() => onEdit(product)}>Edit</button> : null}
                    {onDelete ? <button type="button" className="danger" onClick={() => onDelete(product.id)}>Delete</button> : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="shea-admin-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
