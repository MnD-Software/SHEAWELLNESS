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
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Trash2,
  Truck,
  Users
} from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { StorefrontImage } from "@/components/storefront/StorefrontImage";
import { BulkMediaManager } from "./BulkMediaManager";
import { uploadMedia } from "@/lib/bulk-media";
import { EnquiriesView } from "./EnquiriesView";
import { readStoredArray } from "@/lib/browser-storage";
import { formatMoney, productPriceForSize, titleCase } from "@/lib/format";
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
import type { PageOverrides } from "@/server/repositories/storeContentRepository";

const adminNav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Boxes },
  { id: "media", label: "Media library", icon: Image },
  { id: "pages", label: "Site pages", icon: FileText },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "enquiries", label: "Enquiries", icon: Mail },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

const productFilters: Array<"all" | ProductStatus> = ["all", "active", "low_stock", "draft"];

type View = (typeof adminNav)[number]["id"];

type RuntimeOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  totalPrice: number;
  createdAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

type ServerOrder = {
  id: string;
  orderNumber: string;
  customer: { fullName: string; email: string };
  items: Array<{ quantity: number }>;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  placedAt: string;
};

function toRuntimeOrder(order: ServerOrder): RuntimeOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.fullName,
    customerEmail: order.customer.email,
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    totalPrice: Number(order.total),
    createdAt: order.placedAt,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus
  };
}

type RuntimeReview = {
  source?: string;
  productId: string;
  name: string;
  rating: number;
  body: string;
  createdAt: string;
};

type ProductFormState = {
  gallery: string;
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
  variations: ProductVariationDraft[];
};

function adminRequestHeaders(headers: Record<string, string> = {}) { return headers; }

type MediaSection = "hero" | "images" | "videos";

type ProductVariationDraft = {
  id: string;
  label: string;
  price: string;
  imageUrl: string;
  videoUrl: string;
};

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
  alt: string;
  fit: "cover" | "contain";
  rotation: string;
  poster: string;
};

type ContentSaveResult =
  | { success: true; data?: { media?: SheaMediaConfig } }
  | { success: false; message: string };

const emptyMediaConfig: SheaMediaConfig = { heroSlides: [], images: [], videos: [] };

function parseCurrencyInput(value: string) {
  const parsed = Number(value.replaceAll(",", "").trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function productVariationRows(product?: Product): ProductVariationDraft[] {
  const sizes = product?.sizes?.length ? product.sizes : ["100g"];
  const basePrice = product?.price ?? 2000;

  return sizes.map((size, index) => ({
    id: `variation_${index}_${size.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    label: size,
    price: String(product?.sizePrices?.[size] ?? basePrice),
    imageUrl: product?.sizeMedia?.[size]?.imageUrl ?? "",
    videoUrl: product?.sizeMedia?.[size]?.videoUrl ?? ""
  }));
}

function normalizeVariationRows(variations: ProductVariationDraft[], fallbackPrice: string) {
  const seen = new Set<string>();
  const rows = variations
    .map((variation) => ({
      label: variation.label.trim(),
      price: parseCurrencyInput(variation.price || fallbackPrice),
      imageUrl: variation.imageUrl.trim(),
      videoUrl: variation.videoUrl.trim()
    }))
    .filter((variation) => variation.label)
    .filter((variation) => {
      const key = variation.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const safeRows = rows.length ? rows : [{ label: "One size", price: parseCurrencyInput(fallbackPrice), imageUrl: "", videoUrl: "" }];
  const sizePrices = Object.fromEntries(safeRows.map((variation) => [variation.label, variation.price]));
  const sizeMedia = Object.fromEntries(safeRows
    .filter((variation) => variation.imageUrl || variation.videoUrl)
    .map((variation) => [variation.label, {
      ...(variation.imageUrl ? { imageUrl: variation.imageUrl } : {}),
      ...(variation.videoUrl ? { videoUrl: variation.videoUrl } : {})
    }]));

  return {
    sizes: safeRows.map((variation) => variation.label),
    price: safeRows[0]?.price ?? 0,
    sizePrices,
    sizeMedia: Object.keys(sizeMedia).length ? sizeMedia : undefined
  };
}

function syncVariationFields(current: ProductFormState, variations: ProductVariationDraft[]) {
  return {
    ...current,
    variations,
    sizes: variations.map((variation) => variation.label.trim()).filter(Boolean).join(", "),
    price: variations[0]?.price ?? current.price
  };
}

function productDisplayPrice(product: Product, currency: string) {
  const sizes = product.sizes?.length ? product.sizes : ["One size"];
  const prices = sizes.map((size) => productPriceForSize(product, size)).filter((price) => price > 0);
  if (!prices.length) return formatMoney(product.price, currency);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  return lowest === highest ? formatMoney(lowest, currency) : `From ${formatMoney(lowest, currency)} to ${formatMoney(highest, currency)}`;
}

function productVariationSummary(product: Product, currency: string) {
  const sizes = product.sizes?.length ? product.sizes : ["One size"];
  return sizes
    .map((size) => `${size}: ${formatMoney(productPriceForSize(product, size), currency)}`)
    .join(", ");
}

function productToDraft(product?: Product): ProductFormState {
  const variations = productVariationRows(product);

  return {
    id: product?.id ?? "",
    title: product?.title ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "Skin Care",
    badge: product?.badge ?? "Shea Wellness",
    imageUrl: product?.imageUrl ?? "",
    gallery: (product?.gallery ?? []).join("\n"),
    sizes: variations.map((variation) => variation.label).join(", "),
    material: product?.material ?? "Raw Shea Butter",
    deliveryBadge: product?.deliveryBadge ?? "Handcrafted skincare",
    price: String(product?.price ?? 2000),
    inventoryQty: String(product?.inventoryQty ?? 24),
    status: product?.status ?? "draft",
    variations
  };
}

function mediaToDraft(asset?: SheaMediaAsset | SheaHeroSlide): MediaFormState {
  const heroAsset = (asset ?? {}) as Partial<SheaHeroSlide>;

  return {
    id: asset?.id ?? "",
    title: asset?.title ?? "",
    src: asset?.src ?? "",
    tag: asset?.tag ?? "Skin routine",
    kicker: heroAsset.kicker ?? "Naturally considered",
    body: heroAsset.body ?? "Show the customer care journey with real Shea Wellness media.",
    ctaLabel: heroAsset.ctaLabel ?? "Shop routines",
    ctaHref: heroAsset.ctaHref ?? "/shop",
    objectPosition: asset?.objectPosition ?? "50% 50%",
    alt: asset?.alt ?? "",
    fit: asset?.fit ?? (heroAsset.kicker ? "cover" : "contain"),
    rotation: String(asset?.rotation ?? 0),
    poster: asset?.poster ?? ""
  };
}

function mediaFilename(src: string) {
  const filename = src.split("?")[0].split("/").pop() || src;
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

async function uploadAdminMedia(file: File) {
  if (file.size > 3 * 1024 * 1024) return (await uploadMedia(file)).url;
  const form = new FormData();
  form.set("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", headers: adminRequestHeaders(), body: form });
  const responseText = await response.text();
  let payload: { data?: { url?: unknown }; error?: unknown } = {};

  try {
    payload = responseText ? JSON.parse(responseText) as { data?: { url?: unknown }; error?: unknown } : {};
  } catch {
    // The HTTP status remains useful if a proxy returns a non-JSON error page.
  }

  const errorMessage = typeof payload.error === "string" ? payload.error : "Unable to upload media.";
  const url = typeof payload.data?.url === "string" ? payload.data.url : null;
  if (!response.ok || !url) throw new Error(errorMessage);
  return url;
}

export function AdminShell({ snapshot }: { snapshot: PlatformSnapshot }) {
  const [view, setView] = useState<View>("overview");
  const [createProductRequest, setCreateProductRequest] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof productFilters)[number]>("all");
  const [managedProducts, setManagedProducts] = useState<Product[]>(snapshot.products);
  const [runtimeOrders, setRuntimeOrders] = useState<RuntimeOrder[]>([]);
  const [ordersState, setOrdersState] = useState<"loading" | "ready" | "error">("loading");
  const [ordersMessage, setOrdersMessage] = useState("");
  const [runtimeReviews, setRuntimeReviews] = useState<RuntimeReview[]>([]);
  const [mediaConfig, setMediaConfig] = useState<SheaMediaConfig>(emptyMediaConfig);
  const [pageOverrides, setPageOverrides] = useState<PageOverrides>({});
  const [contentLoaded, setContentLoaded] = useState(false);
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
    const savedReviews = readStoredArray("sheaWellnessReviews") as RuntimeReview[];
    setRuntimeReviews(savedReviews.filter((review) => review.source === "shea_storefront_review"));

  }, []);

  useEffect(() => {
    let cancelled = false;
    const headers = adminRequestHeaders();

    setOrdersState("loading");
    setContentLoaded(false);

    void fetch("/api/admin/orders?limit=100", { cache: "no-store", headers })
      .then(async (response) => {
        const payload = await response.json() as { data?: ServerOrder[]; error?: string };
        if (!response.ok || !Array.isArray(payload.data)) throw new Error(payload.error ?? "Unable to load orders.");
        if (cancelled) return;
        setRuntimeOrders(payload.data.map(toRuntimeOrder));
        setOrdersState("ready");
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setOrdersState("error");
        setOrdersMessage(error.message);
      });

    void fetch("/api/admin/content", { cache: "no-store", headers })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to load content.");
        if (cancelled) return;
        setManagedProducts((payload.data.products as Product[]).map((product) => ({ ...product, imageUrl: replaceRetiredSyntheticImage(product.imageUrl) })));
        setMediaConfig(sanitizeSheaMediaConfig(payload.data.media as SheaMediaConfig));
        setPageOverrides((payload.data.pageOverrides as PageOverrides | undefined) ?? {});
        setSaveState(payload.data.persisted ? "saved" : "setup");
        setSaveMessage(payload.data.persisted ? "All changes are synced to Neon" : "Add DATABASE_URL to enable saving");
        setContentLoaded(true);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setSaveState("error");
        setSaveMessage(error.message);
        setContentLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function persistContent(body: object): Promise<ContentSaveResult> {
    setSaveState("saving");
    setSaveMessage("Saving changes…");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: adminRequestHeaders({ "content-type": "application/json" }),
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save changes.");
      setSaveState("saved");
      setSaveMessage("Saved to Neon");
      return { success: true, data: payload.data as { media?: SheaMediaConfig } };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save changes.";
      setSaveState("error");
      setSaveMessage(message);
      return { success: false, message };
    }
  }

  async function saveManagedProducts(nextProducts: Product[]) {
    const result = await persistContent({ type: "products", products: nextProducts });
    if (result.success) {
      setManagedProducts(nextProducts);
      return true;
    }
    return false;
  }

  async function saveMediaConfig(nextMediaConfig: SheaMediaConfig): Promise<ContentSaveResult> {
    const result = await persistContent({ type: "media", media: nextMediaConfig });
    if (result.success) setMediaConfig(sanitizeSheaMediaConfig(result.data?.media ?? nextMediaConfig));
    return result;
  }

  async function savePageOverridesConfig(nextPageOverrides: PageOverrides) {
    const result = await persistContent({ type: "pageOverrides", pageOverrides: nextPageOverrides });
    if (result.success) setPageOverrides(nextPageOverrides);
  }

  async function updateOrderStatus(orderId: string, update: Pick<RuntimeOrder, "paymentStatus" | "fulfillmentStatus">) {
    setOrdersMessage("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: adminRequestHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ id: orderId, ...update })
      });
      const payload = await response.json() as { data?: ServerOrder; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error ?? "Unable to update order.");
      const saved = toRuntimeOrder(payload.data);
      setRuntimeOrders((orders) => orders.map((order) => order.id === saved.id ? saved : order));
    } catch (error) {
      setOrdersMessage(error instanceof Error ? error.message : "Unable to update order.");
    }
  }

  function openNewProduct() {
    setView("products");
    setCreateProductRequest((request) => request + 1);
  }

  const adminOrders = runtimeOrders;

  return (
    <div className={clsx("shea-admin", sidebarCollapsed && "sidebar-collapsed")} data-admin-ready={contentLoaded}>
      <aside className="shea-admin-sidebar">
        <div className="shea-admin-brand">
          <div>S</div>
          <span>Shea Wellness LTD</span>
          <small>Store administration</small>
        </div>

        <button type="button" className="shea-admin-sidebar-toggle" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          <span>{sidebarCollapsed ? "Expand" : "Collapse"}</span>
        </button>

        <nav aria-label="Shea Wellness admin navigation">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <button type="button" key={item.id} aria-label={item.label} className={clsx(view === item.id && "active")} onClick={() => setView(item.id)}>
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
        {view === "orders" ? <OrdersView snapshot={snapshot} orders={adminOrders} state={ordersState} message={ordersMessage} onStatusUpdate={updateOrderStatus} /> : null}
        {view === "products" ? <ProductsView products={filteredProducts} allProducts={managedProducts} storeId={activeStore.id} filter={filter} setFilter={setFilter} saveProducts={saveManagedProducts} createRequest={createProductRequest} mediaConfig={mediaConfig} mediaReady={contentLoaded} saveMediaConfig={saveMediaConfig} /> : null}
        {view === "pages" ? <SitePagesView pageOverrides={pageOverrides} savePageOverrides={savePageOverridesConfig} mediaConfig={mediaConfig} mediaReady={contentLoaded} saveMediaConfig={saveMediaConfig} /> : null}
        {view === "media" ? contentLoaded ? <MediaView mediaConfig={mediaConfig} saveMediaConfig={saveMediaConfig} /> : <p role="status">Loading your media library…</p> : null}
        {view === "settings" ? <SettingsView snapshot={snapshot} /> : null}
        {view === "enquiries" ? <EnquiriesView /> : null}
      </main>
    </div>
  );
}

const adminSitePages = [
  { title: "Homepage", route: "/", group: "Storefront", manage: "media" as View },
  { title: "Shop", route: "/shop", group: "Commerce", manage: "products" as View },
  { title: "Products", route: "/products", group: "Commerce", manage: "products" as View },
  { title: "Face care", route: "/face", group: "Departments", manage: "products" as View },
  { title: "Skin care", route: "/skin", group: "Departments", manage: "products" as View },
  { title: "Hair care", route: "/hair", group: "Departments", manage: "products" as View },
  { title: "Wellness gifts", route: "/wellness-gifts", group: "Departments", manage: "products" as View },
  { title: "Spa essentials", route: "/spa-essentials", group: "Departments", manage: "products" as View },
  { title: "Our story", route: "/about", group: "Brand", manage: "media" as View },
  { title: "Wellness guides", route: "/wellness-guides", group: "Content", manage: "media" as View },
  { title: "Wholesale", route: "/wholesale", group: "Business", manage: "media" as View },
  { title: "Sustainability", route: "/sustainability", group: "Brand", manage: "media" as View },
  { title: "Blog", route: "/blog", group: "Content", manage: "media" as View },
  { title: "Quality", route: "/quality", group: "Brand", manage: "media" as View },
  { title: "Contact", route: "/contact", group: "Support", manage: "settings" as View },
  { title: "FAQ", route: "/faq", group: "Support", manage: "settings" as View },
  { title: "Catalogue", route: "/catalogue", group: "Business", manage: "media" as View },
  { title: "Shipping policy", route: "/shipping-policy", group: "Policies", manage: "settings" as View },
  { title: "Refund policy", route: "/refund-policy", group: "Policies", manage: "settings" as View },
  { title: "Policies", route: "/policies", group: "Policies", manage: "settings" as View },
  { title: "Customer account", route: "/account", group: "Customer", manage: "settings" as View }
];

function SitePagesView({ pageOverrides, savePageOverrides, mediaConfig, mediaReady, saveMediaConfig }: { pageOverrides: PageOverrides; savePageOverrides: (overrides: PageOverrides) => void; mediaConfig: SheaMediaConfig; mediaReady: boolean; saveMediaConfig: (config: SheaMediaConfig) => Promise<ContentSaveResult> }) {
  const [pageQuery, setPageQuery] = useState("");
  const [editingPage, setEditingPage] = useState<(typeof adminSitePages)[number] | null>(null);
  const [elements, setElements] = useState<Array<{ kind: "text" | "image"; index: number; label: string; value: string }>>([]);
  const [selectedElement, setSelectedElement] = useState<{ kind: "text" | "image"; index: number; label: string; value: string } | null>(null);
  const [imagePickerElement, setImagePickerElement] = useState<{ kind: "image"; index: number; label: string; value: string } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const visiblePages = adminSitePages.filter((page) => `${page.title} ${page.group} ${page.route}`.toLowerCase().includes(pageQuery.trim().toLowerCase()));

  function inspectPage() {
    const documentRoot = iframeRef.current?.contentDocument;
    if (!documentRoot || !editingPage) return;
    const textNodes = Array.from(documentRoot.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main h4, main p, main li, main blockquote, main figcaption"));
    const imageNodes = Array.from(documentRoot.querySelectorAll<HTMLImageElement>("main img"));
    const texts = textNodes.map((node, index) => ({ kind: "text" as const, index, label: `${node.tagName} ${index + 1}`, value: pageOverrides[editingPage.route]?.texts?.[String(index)] ?? node.textContent?.trim() ?? "" }));
    const images = imageNodes.map((node, index) => ({ kind: "image" as const, index, label: `Image ${index + 1}: ${node.dataset.imageLabel || node.alt || "Untitled"}`, value: pageOverrides[editingPage.route]?.images?.[String(index)] ?? node.getAttribute("src") ?? "" }));
    texts.forEach((element) => { textNodes[element.index].textContent = element.value; });
    images.forEach((element) => { if (element.value) imageNodes[element.index].src = element.value; else imageNodes[element.index].removeAttribute("src"); });
    setElements([...texts, ...images]);
    setSelectedElement(null);

    [...textNodes, ...imageNodes].forEach((node, combinedIndex) => {
      const isImage = combinedIndex >= textNodes.length;
      const index = isImage ? combinedIndex - textNodes.length : combinedIndex;
      const element = (isImage ? images : texts)[index];
      if (node.dataset.cmsEditable === "true") return;
      node.dataset.cmsEditable = "true";
      node.style.cursor = "pointer";
      node.style.outlineOffset = "4px";
      node.title = `Click to edit ${element.label}`;
      node.addEventListener("mouseenter", () => { node.style.outline = "2px solid #008060"; });
      node.addEventListener("mouseleave", () => { node.style.outline = ""; });
      node.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isImage) {
          const imageElement = element as { kind: "image"; index: number; label: string; value: string };
          setSelectedElement(imageElement);
          setImagePickerElement(imageElement);
          return;
        }
        const nextValue = window.prompt(`Edit ${element.label}`, element.value);
        if (nextValue === null) return;
        const nextElement = { ...element, value: nextValue };
        setSelectedElement(nextElement);
        setElements((items) => items.map((item) => item.kind === nextElement.kind && item.index === nextElement.index ? nextElement : item));
        node.textContent = nextValue;
      }, { capture: true });
    });
  }

  function handlePreviewLoad() {
    const previewWindow = iframeRef.current?.contentWindow;
    const previewDocument = iframeRef.current?.contentDocument;
    if (!previewWindow || !previewDocument) return;
    if (previewDocument.documentElement.dataset.cmsHydrated === "true") {
      inspectPage();
      return;
    }
    previewWindow.addEventListener("shea-cms-hydrated", inspectPage, { once: true });
  }

  function updateSelectedElement(value: string) {
    if (!editingPage || !selectedElement) return;
    const nextElement = { ...selectedElement, value };
    setSelectedElement(nextElement);
    setElements((items) => items.map((item) => item.kind === nextElement.kind && item.index === nextElement.index ? nextElement : item));
    const documentRoot = iframeRef.current?.contentDocument;
    if (!documentRoot) return;
    if (nextElement.kind === "text") {
      const node = documentRoot.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main h4, main p, main li, main blockquote, main figcaption")[nextElement.index];
      if (node) node.textContent = value;
    } else {
      const node = documentRoot.querySelectorAll<HTMLImageElement>("main img")[nextElement.index];
      if (node) { if (value) node.src = value; else node.removeAttribute("src"); }
    }
  }

  function savePage() {
    if (!editingPage) return;
    const texts: Record<string, string> = {};
    const images: Record<string, string> = {};
    elements.forEach((element) => {
      (element.kind === "text" ? texts : images)[String(element.index)] = element.value;
    });
    savePageOverrides({ ...pageOverrides, [editingPage.route]: { texts, images } });
  }

  function replaceImage(element: { kind: "image"; index: number; label: string; value: string }, src: string) {
    const nextElement = { ...element, value: src };
    setSelectedElement(nextElement);
    setElements((items) => items.map((item) => item.kind === "image" && item.index === element.index ? nextElement : item));
    const node = iframeRef.current?.contentDocument?.querySelectorAll<HTMLImageElement>("main img")[element.index];
    if (node) { if (src) node.src = src; else node.removeAttribute("src"); }
    setImagePickerElement(null);
  }

  if (editingPage) {
    return <section className="shea-admin-stack shea-visual-editor">
      <AdminHeading eyebrow="Visual editor" title={editingPage.title} action={<button type="button" className="shea-admin-secondary-action" onClick={() => setEditingPage(null)}>Back to pages</button>} />
      <div className="shea-visual-editor-toolbar"><span>{editingPage.route}</span><button type="button" onClick={savePage}>Save page changes</button></div>
      <div className="shea-visual-editor-layout">
        <div className="shea-visual-editor-preview"><iframe ref={iframeRef} src={`${editingPage.route}?cmsPreview=1`} title={`${editingPage.title} live preview`} onLoad={handlePreviewLoad} /></div>
        <aside className="shea-visual-editor-controls">
          <header><strong>Page elements</strong><span>{elements.length} editable items</span></header>
          <div className="shea-visual-editor-elements">{elements.map((element) => <button type="button" key={`${element.kind}-${element.index}`} className={clsx(selectedElement?.kind === element.kind && selectedElement.index === element.index && "active")} onClick={() => setSelectedElement(element)}><span>{element.label}</span><small>{element.value}</small></button>)}</div>
          {selectedElement ? <label>{selectedElement.kind === "image" ? "Image URL" : "Text content"}<textarea value={selectedElement.value} onChange={(event) => updateSelectedElement(event.target.value)} /></label> : <p>Select a text or image item to edit it. Changes appear in the preview immediately.</p>}
        </aside>
      </div>
      {imagePickerElement ? <MediaLibraryPicker
        assets={[...mediaConfig.heroSlides, ...mediaConfig.images]}
        isLoading={!mediaReady}
        selectedSrc={imagePickerElement.value}
        onClose={() => setImagePickerElement(null)}
        onSelect={(src) => replaceImage(imagePickerElement, src)}
        onUploadFile={async (file) => {
          const src = await uploadAdminMedia(file);
          if (!mediaConfig.images.some((asset) => asset.src === src)) {
            const result = await saveMediaConfig({ ...mediaConfig, images: [...mediaConfig.images, { id: `page_image_${Date.now()}`, title: file.name.replace(/\.[^.]+$/, ""), src, type: "image", tag: "Page image" }] });
            if (!result.success) throw new Error(result.message);
          }
          return src;
        }}
      /> : null}
    </section>;
  }

  return (
    <section className="shea-admin-stack">
      <AdminHeading eyebrow="Website" title="Site pages" />
      <div className="shea-admin-page-search"><Search size={17} /><input value={pageQuery} onChange={(event) => setPageQuery(event.target.value)} placeholder="Search pages and sections" /></div>
      <div className="shea-admin-page-grid">
        {visiblePages.map((page) => (
          <article key={page.route}>
            <span>{page.group}</span>
            <h2>{page.title}</h2>
            <code>{page.route}</code>
            <div>
              <a href={page.route} target="_blank" rel="noreferrer">View page</a>
              <button type="button" onClick={() => setEditingPage(page)}>Edit page</button>
            </div>
          </article>
        ))}
      </div>
    </section>
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
            {mediaConfig.images.slice(0, 6).map((asset) => <StorefrontImage key={asset.id} src={asset.src} alt={asset.title} />)}
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
  mediaReady,
  saveMediaConfig
}: {
  products: PlatformSnapshot["products"];
  allProducts: PlatformSnapshot["products"];
  storeId: string;
  filter: (typeof productFilters)[number];
  setFilter: (filter: (typeof productFilters)[number]) => void;
  saveProducts: (products: Product[]) => Promise<boolean>;
  createRequest: number;
  mediaConfig: SheaMediaConfig;
  mediaReady: boolean;
  saveMediaConfig: (mediaConfig: SheaMediaConfig) => Promise<ContentSaveResult>;
}) {
  const [draft, setDraft] = useState<ProductFormState>(() => productToDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUploadState, setImageUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [imageUploadMessage, setImageUploadMessage] = useState("Choose a JPG, PNG, WebP, GIF, or AVIF image up to 10 MB.");
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<string>("primary");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const productEditorRef = useRef<HTMLDivElement | null>(null);
  const categoryOptions = Array.from(new Set([...allProducts.map((product) => product.category), "Skin Care", "Face Care", "Hair Care", "Essential Oils"]));

  function updateDraft(field: keyof ProductFormState, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateVariation(variationId: string, field: keyof ProductVariationDraft, value: string) {
    setDraft((current) => syncVariationFields(current, current.variations.map((variation) => (
      variation.id === variationId ? { ...variation, [field]: value } : variation
    ))));
  }

  function addVariation() {
    setDraft((current) => syncVariationFields(current, [
      ...current.variations,
      { id: `variation_${Date.now()}_${current.variations.length}`, label: "", price: current.variations.at(-1)?.price ?? current.price, imageUrl: "", videoUrl: "" }
    ]));
  }

  function removeVariation(variationId: string) {
    setDraft((current) => {
      const nextVariations = current.variations.filter((variation) => variation.id !== variationId);
      return syncVariationFields(current, nextVariations.length ? nextVariations : [{ id: `variation_${Date.now()}_0`, label: "One size", price: current.price, imageUrl: "", videoUrl: "" }]);
    });
  }

  function startCreate() {
    setEditingId(null);
    setDraft(productToDraft());
    setIsEditorOpen(true);
    window.setTimeout(() => productEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  useEffect(() => {
    if (createRequest > 0) startCreate();
  }, [createRequest]);

  function startEdit(product: Product) {
    setEditingId(product.id);
    setDraft(productToDraft(product));
    setIsEditorOpen(true);
    window.setTimeout(() => productEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function uploadProductImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploadState("uploading");
    setImageUploadMessage(`Uploading ${file.name}…`);
    try {
      const imageUrl = await uploadAdminMedia(file);
      updateDraft("imageUrl", imageUrl);
      if (!mediaConfig.images.some((asset) => asset.src === imageUrl)) {
        const result = await saveMediaConfig({
          ...mediaConfig,
          images: [...mediaConfig.images, { id: `image_${Date.now()}`, title: file.name.replace(/\.[^.]+$/, ""), src: imageUrl, type: "image", tag: "Product image", objectPosition: "50% 50%" }]
        });
        if (!result.success) throw new Error(result.message);
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

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const existingProduct = allProducts.find((product) => product.id === editingId);
    const productId = existingProduct?.id ?? `prod_${Date.now()}`;
    const normalizedVariations = normalizeVariationRows(draft.variations, draft.price);
    const nextProduct: Product = {
      id: productId,
      storeId,
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category.trim() || "Skin Care",
      badge: draft.badge.trim() || "Shea Wellness",
      imageUrl: draft.imageUrl.trim(),
      gallery: draft.gallery.split(/\r?\n/).map(value => value.trim()).filter(Boolean),
      imagePosition: existingProduct?.imagePosition ?? "50% 50%",
      rating: existingProduct?.rating ?? 0,
      reviewCount: existingProduct?.reviewCount ?? 0,
      colors: [],
      sizes: normalizedVariations.sizes,
      material: draft.material.trim() || "Raw Shea Butter",
      deliveryBadge: draft.deliveryBadge.trim() || "Handcrafted skincare",
      price: normalizedVariations.price,
      sizePrices: normalizedVariations.sizePrices,
      sizeMedia: normalizedVariations.sizeMedia,
      inventoryQty: Number(draft.inventoryQty) || 0,
      status: draft.status,
      channel: existingProduct?.channel ?? "both",
      sales: existingProduct?.sales ?? 0
    };

    const nextProducts = existingProduct
      ? allProducts.map((product) => (product.id === existingProduct.id ? nextProduct : product))
      : [nextProduct, ...allProducts];

    const saved = await saveProducts(nextProducts);
    if (!saved) return;
    setEditingId(nextProduct.id);
    setDraft(productToDraft(nextProduct));
  }

  async function deleteProduct(productId: string) {
    const confirmed = window.confirm("Remove this product from the Shea Wellness storefront?");
    if (!confirmed) return;

    const saved = await saveProducts(allProducts.filter((product) => product.id !== productId));
    if (!saved) return;
    if (editingId === productId) {
      setEditingId(null);
      setIsEditorOpen(false);
    }
  }

  return (
    <section className="shea-admin-stack">
      <AdminHeading
        eyebrow="Products"
        title={isEditorOpen ? (editingId ? "Edit product" : "Add product") : "Manage your catalogue"}
        action={isEditorOpen
          ? <button type="button" className="shea-admin-secondary-action" onClick={() => setIsEditorOpen(false)}>Back to products</button>
          : <button type="button" className="shea-admin-primary-action" onClick={startCreate}><PackagePlus size={17} /> Add new product</button>}
      />
      {!isEditorOpen ? <div className="shea-admin-catalogue-tools">
        <div>
          <strong>{allProducts.length} products</strong>
          <span>{products.length === allProducts.length ? "All products are shown" : `${products.length} match your search and filter`}</span>
        </div>
        <ProductFilter filter={filter} setFilter={setFilter} />
      </div> : null}
      <section className={clsx("shea-admin-products-page", isEditorOpen && "editor-open")}>
        {!isEditorOpen ? (
        <Panel title="Product list" description="Edit a product or remove it from the storefront.">
          {products.length ? (
            <ProductTable products={products} currency="KES" onView={setSelectedProduct} onEdit={startEdit} onDelete={deleteProduct} />
          ) : (
            <div className="shea-admin-empty">
              <Boxes size={28} />
              <strong>No products found</strong>
              <p>Try another search or filter, or add a new product.</p>
              <button type="button" onClick={startCreate}>Add product</button>
            </div>
          )}
        </Panel>
        ) : null}
        {isEditorOpen ? (
        <Panel
          title={editingId ? "Modify product" : "Add product"}
          description="Changes save to Neon and publish to the customer storefront."
          action={editingId ? <button type="button" onClick={startCreate}>New product</button> : undefined}
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
            <div className="shea-admin-form-row">
              <label>
                Category
                <input list="shea-product-category-options" value={draft.category} onChange={(event) => updateDraft("category", event.target.value)} />
                <datalist id="shea-product-category-options">
                  {categoryOptions.map((category) => <option key={category} value={category} />)}
                </datalist>
              </label>
              <label>
                Status
                <select value={draft.status} onChange={(event) => updateDraft("status", event.target.value as ProductStatus)}>
                  {productFilters.filter((item) => item !== "all").map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
              </label>
            </div>
            <label>
              Description
              <textarea required value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Short storefront product description" />
            </label>
            <section className="shea-admin-variation-editor" aria-labelledby="shea-product-variations-heading">
              <header>
                <div>
                  <span>Product variations</span>
                  <strong id="shea-product-variations-heading">{draft.variations.length} {draft.variations.length === 1 ? "option" : "options"}</strong>
                </div>
                <button type="button" onClick={addVariation}><Plus size={16} /> Add variation</button>
              </header>
              <div className="shea-admin-variation-list">
                {draft.variations.map((variation, index) => (
                  <div className="shea-admin-variation-row" key={variation.id}>
                    <label>
                      <span>Option</span>
                      <input required value={variation.label} onChange={(event) => updateVariation(variation.id, "label", event.target.value)} placeholder={index === 0 ? "100g" : "250g"} />
                    </label>
                    <label>
                      <span>Price</span>
                      <input required type="number" min="0" step="1" value={variation.price} onChange={(event) => updateVariation(variation.id, "price", event.target.value)} placeholder="2000" />
                    </label>
                    <label className="shea-admin-variation-media-field">
                      <span>Size image URL <em>optional</em></span>
                      <input value={variation.imageUrl} onChange={(event) => updateVariation(variation.id, "imageUrl", event.target.value)} placeholder="/assets/product-100g.jpg" />
                      <button type="button" onClick={() => {setMediaTarget(variation.id);setIsMediaLibraryOpen(true);}}>Choose variation image</button>
                    </label>
                    <label className="shea-admin-variation-media-field">
                      <span>Size video URL <em>optional</em></span>
                      <input value={variation.videoUrl} onChange={(event) => updateVariation(variation.id, "videoUrl", event.target.value)} placeholder="/assets/product-100g.mp4" />
                    </label>
                    <button type="button" onClick={() => removeVariation(variation.id)} disabled={draft.variations.length === 1} aria-label={`Remove ${variation.label || "variation"}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="shea-admin-variation-help">Leave size media blank to use the main product image. Add a verified image or video URL only when it belongs to that exact option.</p>
            </section>
            <div className="shea-admin-form-row">
              <label>
                Inventory
                <input required type="number" min="0" value={draft.inventoryQty} onChange={(event) => updateDraft("inventoryQty", event.target.value)} />
              </label>
              <label>
                Storefront badge
                <input value={draft.deliveryBadge} onChange={(event) => updateDraft("deliveryBadge", event.target.value)} />
              </label>
            </div>
            <div className="shea-admin-image-field">
              <span>Product image</span>
              {draft.imageUrl ? <StorefrontImage src={draft.imageUrl} alt="Selected product" /> : null}
              <div>
                <button type="button" onClick={() => {setMediaTarget("primary");setIsMediaLibraryOpen(true);}}><Image size={16} /> Choose from media library</button>
                <small>Pick an existing image or upload a new one below.</small>
              </div>
            </div>
            <label className={`shea-admin-upload ${imageUploadState}`}>
              <span>{imageUploadState === "uploading" ? "Uploading image…" : "Upload from computer"}</span>
              <small>{imageUploadMessage}</small>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={uploadProductImage} disabled={imageUploadState === "uploading"} />
            </label>
            <label>Product gallery URLs (one per line)<textarea value={draft.gallery} onChange={event => updateDraft("gallery", event.target.value)} placeholder="Choose media in the library and paste its URL here" /></label>
            <button type="button" onClick={() => {setMediaTarget("gallery");setIsMediaLibraryOpen(true);}}>Add image to gallery</button>
            <div className="admin-gallery-preview">{draft.gallery.split(/\r?\n/).filter(Boolean).map(src => <figure key={src}><StorefrontImage src={src} alt="Gallery image" loading="lazy" /><button type="button" onClick={() => updateDraft("gallery", draft.gallery.split(/\r?\n/).filter(value => value !== src).join("\n"))}>Remove gallery image</button></figure>)}</div>
            <details className="shea-admin-advanced-fields">
              <summary>More product details <span>Optional</span></summary>
              <div>
                <label>
                  Product tag
                  <input value={draft.badge} onChange={(event) => updateDraft("badge", event.target.value)} />
                </label>
                <label>
                  Ingredients / material
                  <input value={draft.material} onChange={(event) => updateDraft("material", event.target.value)} />
                </label>
              </div>
            </details>
            <button type="submit">{editingId ? "Save product changes" : "Create product"}</button>
          </form>
          </div>
        </Panel>
        ) : null}
      </section>
      {isMediaLibraryOpen ? (
        <MediaLibraryPicker
          assets={[
            ...mediaConfig.heroSlides,
            ...mediaConfig.images,
            ...allProducts.map((product) => ({ id: `product_${product.id}`, title: product.title, src: product.imageUrl, type: "image" as const, tag: "Product image" }))
          ]}
          isLoading={!mediaReady}
          selectedSrc={draft.imageUrl}
          onClose={() => setIsMediaLibraryOpen(false)}
          onSelect={(src) => {
            if (mediaTarget === "gallery") updateDraft("gallery", [...new Set([...draft.gallery.split(/\r?\n/).filter(Boolean),src])].join("\n"));
            else if (mediaTarget !== "primary") updateVariation(mediaTarget, "imageUrl", src);
            else updateDraft("imageUrl", src);
            setIsMediaLibraryOpen(false);
          }}
        />
      ) : null}
      {selectedProduct ? (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onEdit={() => {
            setSelectedProduct(null);
            startEdit(selectedProduct);
          }}
          onDelete={() => {
            deleteProduct(selectedProduct.id);
            setSelectedProduct(null);
          }}
        />
      ) : null}
    </section>
  );
}

function ProductDetailsModal({ product, onClose, onEdit, onDelete }: { product: Product; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="shea-product-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="shea-product-modal" role="dialog" aria-modal="true" aria-labelledby="product-details-title">
        <header>
          <div><span>{product.category}</span><h2 id="product-details-title">{product.title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close product details">×</button>
        </header>
        <div className="shea-product-modal-body">
          <StorefrontImage src={product.imageUrl} alt={product.title} />
          <div>
            <span className={clsx("shea-admin-status", product.status)}>{titleCase(product.status)}</span>
            <p>{product.description}</p>
            <dl>
              <div><dt>Inventory</dt><dd>{product.inventoryQty}</dd></div>
              <div><dt>Price</dt><dd>{productDisplayPrice(product, "KES")}</dd></div>
              <div><dt>Variations</dt><dd>{productVariationSummary(product, "KES")}</dd></div>
              <div><dt>Material</dt><dd>{product.material}</dd></div>
            </dl>
          </div>
        </div>
        <footer>
          <button type="button" className="danger" onClick={onDelete}>Delete product</button>
          <button type="button" onClick={onEdit}>Edit product</button>
        </footer>
      </section>
    </div>
  );
}

function MediaLibraryPicker({
  assets,
  selectedSrc,
  onSelect,
  onClose,
  onUploadFile,
  isLoading = false
}: {
  assets: Array<SheaMediaAsset | SheaHeroSlide>;
  selectedSrc: string;
  onSelect: (src: string) => void;
  onClose: () => void;
  onUploadFile?: (file: File) => Promise<string>;
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [page, setPage] = useState(0);
  const uniqueAssets = Array.from(new Map(assets.filter((asset) => asset.type === "image").map((asset) => [asset.src, asset])).values());
  const visibleAssets = uniqueAssets.filter((asset) => `${asset.title} ${asset.tag}`.toLowerCase().includes(search.trim().toLowerCase()));
  const pageSize = 24;
  const pageCount = Math.max(1, Math.ceil(visibleAssets.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageAssets = visibleAssets.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => setPage(0), [search]);

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
          {onUploadFile ? <label className="shea-media-picker-upload">{uploading ? "Uploading…" : "Upload from computer"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={uploading} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); setUploadError(""); try { onSelect(await onUploadFile(file)); } catch (error) { setUploadError(error instanceof Error ? error.message : "Unable to upload image."); } finally { setUploading(false); event.target.value = ""; } }} /></label> : null}
          <strong>{visibleAssets.length} images</strong>
        </div>
        {uploadError ? <p className="shea-media-picker-error" role="alert">{uploadError}</p> : null}
        <div className="shea-media-picker-grid">
          {isLoading ? <p className="shea-media-picker-loading">Loading your saved media library…</p> : pageAssets.map((asset) => (
            <button type="button" key={asset.src} className={clsx(asset.src === selectedSrc && "selected")} onClick={() => onSelect(asset.src)} title={asset.title}>
              <StorefrontImage src={asset.src} alt={asset.title} loading="lazy" decoding="async" />
              <span>{asset.title}</span>
              <small>{mediaFilename(asset.src)}</small>
            </button>
          ))}
        </div>
        {!isLoading && visibleAssets.length > pageSize ? <footer className="shea-media-picker-pagination">
          <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0}>Previous</button>
          <span>Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, visibleAssets.length)} of {visibleAssets.length}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1}>Next</button>
        </footer> : null}
        {!isLoading && !visibleAssets.length ? <div className="shea-admin-empty"><Image size={28} /><strong>No images found</strong><p>Upload an image or try a different search.</p></div> : null}
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

function OrdersView({
  snapshot,
  orders,
  state,
  message,
  onStatusUpdate
}: {
  snapshot: PlatformSnapshot;
  orders: RuntimeOrder[];
  state: "loading" | "ready" | "error";
  message: string;
  onStatusUpdate: (orderId: string, update: Pick<RuntimeOrder, "paymentStatus" | "fulfillmentStatus">) => Promise<void>;
}) {
  const fulfillmentStatuses = ["unfulfilled", "partial", "on_hold", "fulfilled"];
  const paymentStatuses = ["pending", "authorized", "paid", "failed", "refunded"];

  return (
    <section className="shea-admin-stack">
      <AdminHeading eyebrow="Operations" title="Orders and fulfillment" />
      {message ? <p className="shea-admin-order-message" role="alert">{message}</p> : null}
      {state === "loading" ? <div className="shea-admin-empty"><ShoppingCart size={28} /><strong>Loading orders</strong><p>Checking the secure order queue…</p></div> : null}
      {state === "error" ? <div className="shea-admin-empty"><ShoppingCart size={28} /><strong>Orders are unavailable</strong><p>{message || "Connect DATABASE_URL to load the order queue."}</p></div> : null}
      {state === "ready" && !orders.length ? <div className="shea-admin-empty"><ShoppingCart size={28} /><strong>No orders yet</strong><p>Submitted storefront orders will appear here for fulfillment.</p></div> : null}
      <section className="shea-admin-grid three">
        {["unfulfilled", "partial", "on_hold", "fulfilled"].map((status) => (
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
                    <div className="shea-admin-order-controls">
                      <strong>{formatMoney(order.totalPrice, snapshot.activeStore.currency)}</strong>
                      <label>
                        Fulfillment
                        <select value={order.fulfillmentStatus} onChange={(event) => void onStatusUpdate(order.id, { paymentStatus: order.paymentStatus, fulfillmentStatus: event.target.value })}>
                          {fulfillmentStatuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
                        </select>
                      </label>
                      <label>
                        Payment
                        <select value={order.paymentStatus} onChange={(event) => void onStatusUpdate(order.id, { paymentStatus: event.target.value, fulfillmentStatus: order.fulfillmentStatus })}>
                          {paymentStatuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
                        </select>
                      </label>
                    </div>
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
  saveMediaConfig: (mediaConfig: SheaMediaConfig) => Promise<ContentSaveResult>;
}) {
  const [section, setSection] = useState<MediaSection>("hero");
  const [draft, setDraft] = useState<MediaFormState>(() => mediaToDraft(mediaConfig.heroSlides[0]));
  const [editingId, setEditingId] = useState<string | null>(mediaConfig.heroSlides[0]?.id ?? null);
  const [imageUploadState, setImageUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [imageUploadMessage, setImageUploadMessage] = useState("Upload an image from this computer or keep using a hosted URL.");
  const [mediaSaveState, setMediaSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [mediaSaveMessage, setMediaSaveMessage] = useState("Changes are saved only after Neon confirms them.");
  const [mediaPage, setMediaPage] = useState(0);
  const [bulkBusy, setBulkBusy] = useState(false);
  const mediaEditorRef = useRef<HTMLDivElement | null>(null);

  const activeItems = section === "hero" ? mediaConfig.heroSlides : section === "images" ? mediaConfig.images : mediaConfig.videos;
  const mediaPageSize = 20;
  const mediaPageCount = Math.max(1, Math.ceil(activeItems.length / mediaPageSize));
  const visibleItems = activeItems.slice(mediaPage * mediaPageSize, (mediaPage + 1) * mediaPageSize);
  const isSavingMedia = mediaSaveState === "saving" || bulkBusy;

  async function commitMediaConfig(nextMediaConfig: SheaMediaConfig) {
    setMediaSaveState("saving");
    setMediaSaveMessage("Saving media changes...");
    const result = await saveMediaConfig(nextMediaConfig);
    if (result.success) {
      setMediaSaveState("idle");
      setMediaSaveMessage("Media changes are saved to Neon.");
      return true;
    }

    setMediaSaveState("error");
    setMediaSaveMessage(result.message);
    return false;
  }

  function updateDraft(field: keyof MediaFormState, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function switchSection(nextSection: MediaSection) {
    const nextItems = nextSection === "hero" ? mediaConfig.heroSlides : nextSection === "images" ? mediaConfig.images : mediaConfig.videos;
    setSection(nextSection);
    setMediaPage(0);
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

  async function uploadMediaFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const mediaLabel = section === "videos" ? "video" : "image";
    setImageUploadState("uploading");
    setImageUploadMessage(`Uploading ${mediaLabel} ${file.name}…`);
    try {
      const mediaUrl = await uploadAdminMedia(file);
      updateDraft("src", mediaUrl);
      setImageUploadState("idle");
      setImageUploadMessage(`${mediaLabel === "video" ? "Video" : "Image"} upload complete. Save the media entry to publish it.`);
    } catch (error) {
      setImageUploadState("error");
      setImageUploadMessage(error instanceof Error ? error.message : "Unable to upload media.");
    } finally {
      event.target.value = "";
    }
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSavingMedia) return;
    const mediaId = editingId ?? `${section}_${Date.now()}`;

    if (section === "hero") {
      const nextSlide: SheaHeroSlide = {
        ...mediaConfig.heroSlides.find(item => item.id === editingId),
        id: mediaId,
        title: draft.title.trim() || "Your everyday ritual",
        src: draft.src.trim(),
        type: "image",
        tag: draft.tag.trim() || "Before and after",
        kicker: draft.kicker.trim() || "Before and after",
        body: draft.body.trim(),
        ctaLabel: draft.ctaLabel.trim() || "Shop routines",
        ctaHref: draft.ctaHref.trim() || "/shop",
        alt: draft.alt.trim(), fit: draft.fit, rotation: Number(draft.rotation) as SheaMediaAsset["rotation"], poster: draft.poster.trim(),
      objectPosition: draft.objectPosition.trim() || "50% 50%"
      };
      const nextSlides = editingId
        ? mediaConfig.heroSlides.map((slide) => (slide.id === editingId ? nextSlide : slide))
        : [...mediaConfig.heroSlides, nextSlide];
      const saved = await commitMediaConfig({ ...mediaConfig, heroSlides: nextSlides });
      if (!saved) return;
      setEditingId(nextSlide.id);
      setDraft(mediaToDraft(nextSlide));
      return;
    }

    const nextAsset: SheaMediaAsset = {
      ...activeItems.find(item => item.id === editingId),
      id: mediaId,
      title: draft.title.trim() || (section === "images" ? "Shea Wellness image" : "Shea Wellness video"),
      src: draft.src.trim(),
      type: section === "images" ? "image" : "video",
      tag: draft.tag.trim() || "Brand media",
      alt: draft.alt.trim(), fit: draft.fit, rotation: Number(draft.rotation) as SheaMediaAsset["rotation"], poster: draft.poster.trim(),
      objectPosition: draft.objectPosition.trim() || "50% 50%"
    };
    const listKey = section === "images" ? "images" : "videos";
    const nextItems = editingId
      ? mediaConfig[listKey].map((item) => (item.id === editingId ? nextAsset : item))
      : [...mediaConfig[listKey], nextAsset];
    const saved = await commitMediaConfig({ ...mediaConfig, [listKey]: nextItems });
    if (!saved) return;
    setEditingId(nextAsset.id);
    setDraft(mediaToDraft(nextAsset));
  }

  async function deleteMedia(mediaId: string) {
    if (isSavingMedia) return;
    const confirmed = window.confirm("Remove this media entry from the Shea Wellness site?");
    if (!confirmed) return;

    if (section === "hero") {
      const nextSlides = mediaConfig.heroSlides.filter((slide) => slide.id !== mediaId);
      const saved = await commitMediaConfig({ ...mediaConfig, heroSlides: nextSlides });
      if (!saved) return;
      setEditingId(nextSlides[0]?.id ?? null);
      setDraft(mediaToDraft(nextSlides[0]));
      return;
    }

    const listKey = section === "images" ? "images" : "videos";
    const nextItems = mediaConfig[listKey].filter((item) => item.id !== mediaId);
    const saved = await commitMediaConfig({ ...mediaConfig, [listKey]: nextItems });
    if (!saved) return;
    setEditingId(nextItems[0]?.id ?? null);
    setDraft(mediaToDraft(nextItems[0]));
  }

  async function moveHeroSlide(mediaId: string, direction: -1 | 1) {
    if (isSavingMedia) return;
    const currentIndex = mediaConfig.heroSlides.findIndex((slide) => slide.id === mediaId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= mediaConfig.heroSlides.length) return;

    const nextSlides = [...mediaConfig.heroSlides];
    const [slide] = nextSlides.splice(currentIndex, 1);
    nextSlides.splice(nextIndex, 0, slide);
    await commitMediaConfig({ ...mediaConfig, heroSlides: nextSlides });
  }

  async function resetMedia() {
    if (isSavingMedia) return;
    const confirmed = window.confirm("Reset carousel copy and clear the image library? Your current media entries will be replaced.");
    if (!confirmed) return;
    const saved = await commitMediaConfig(sheaDefaultMediaConfig);
    if (!saved) return;
    setSection("hero");
    setEditingId(sheaDefaultMediaConfig.heroSlides[0]?.id ?? null);
    setDraft(mediaToDraft(sheaDefaultMediaConfig.heroSlides[0]));
  }

  return (
    <section className="shea-admin-stack">
      <AdminHeading
        eyebrow="Brand media"
        title="Editable storefront media"
        action={<button type="button" onClick={resetMedia} disabled={isSavingMedia}>Reset defaults</button>}
      />
      <BulkMediaManager media={mediaConfig} save={saveMediaConfig} onBusyChange={setBulkBusy} />
      <div className="shea-admin-segments">
        {(["hero", "images", "videos"] as MediaSection[]).map((item) => (
          <button key={item} type="button" className={clsx(section === item && "active")} onClick={() => switchSection(item)} disabled={isSavingMedia}>
            {item === "hero" ? "Homepage carousel" : titleCase(item)}
          </button>
        ))}
      </div>
      <p className={clsx("shea-admin-save-notice", mediaSaveState)} role={mediaSaveState === "error" ? "alert" : "status"}>{mediaSaveMessage}</p>
      <section className="shea-admin-grid wide-left shea-admin-media-layout">
        <Panel
          title={section === "hero" ? "Homepage carousel" : section === "images" ? "Image library" : "Video library"}
          description="Every entry here is editable and saved to the live Neon-backed storefront."
          action={<button type="button" onClick={startCreate} disabled={isSavingMedia}>Add media</button>}
        >
          <div className={section === "videos" ? "shea-admin-video-grid" : clsx("shea-admin-media-grid", section === "hero" && "hero-cards")}>
            {visibleItems.map((asset) => (
              <article key={asset.id}>
                {asset.type === "video" ? (
                  <video src={asset.src} muted loop playsInline preload="metadata" />
                ) : (
                  <StorefrontImage src={asset.src} alt={asset.title} style={{ objectPosition: asset.objectPosition ?? "50% 50%" }} />
                )}
                <span>{asset.tag}</span>
                <strong>{asset.title}</strong>
                <div className="shea-admin-table-actions">
                  <button type="button" onClick={() => startEdit(asset)} disabled={isSavingMedia}>Edit</button>
                  {section === "hero" ? <button type="button" onClick={() => moveHeroSlide(asset.id, -1)} disabled={isSavingMedia}>Up</button> : null}
                  {section === "hero" ? <button type="button" onClick={() => moveHeroSlide(asset.id, 1)} disabled={isSavingMedia}>Down</button> : null}
                  <button type="button" className="danger" onClick={() => deleteMedia(asset.id)} disabled={isSavingMedia}>Delete</button>
                </div>
              </article>
            ))}
          </div>
          {mediaPageCount > 1 ? <div className="shea-admin-pagination">
            <button type="button" disabled={mediaPage === 0} onClick={() => setMediaPage((page) => Math.max(0, page - 1))}>Previous</button>
            <span>Page {mediaPage + 1} of {mediaPageCount}</span>
            <button type="button" disabled={mediaPage >= mediaPageCount - 1} onClick={() => setMediaPage((page) => Math.min(mediaPageCount - 1, page + 1))}>Next</button>
          </div> : null}
        </Panel>
        <Panel
          title={editingId ? "Edit media" : "Add media"}
          description="Edit a slide or library entry. Choose fill for banners and fit for logos and before-and-after photographs."
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
              <input required={section !== "hero"} value={draft.src} onChange={(event) => updateDraft("src", event.target.value)} />
            </label>
            <>
              <label className={`shea-admin-upload ${imageUploadState}`}>
                <span>{imageUploadState === "uploading" ? `Uploading ${section === "videos" ? "video" : "image"}…` : `Upload ${section === "videos" ? "video" : "image"} from computer`}</span>
                <small>{imageUploadMessage}</small>
                <input type="file" accept={section === "videos" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif,image/avif"} onChange={uploadMediaFile} disabled={imageUploadState === "uploading"} />
              </label>
              {draft.src ? section === "videos" ? <video className="shea-admin-upload-preview" src={draft.src} controls preload="metadata" /> : <StorefrontImage className="shea-admin-upload-preview" src={draft.src} alt="Media upload preview" /> : null}
            </>
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
            <label>Alternative text<input value={draft.alt} onChange={event => updateDraft("alt", event.target.value)} /></label>
            <div className="shea-admin-form-row"><label>Image fitting<select value={draft.fit} onChange={event => updateDraft("fit", event.target.value)}><option value="cover">Fill the card</option><option value="contain">Fit the whole image</option></select></label><label>Image rotation<select value={draft.rotation} onChange={event => updateDraft("rotation", event.target.value)}>{[0,90,180,270].map(value => <option key={value} value={value}>{value}°</option>)}</select></label></div>
            {section === "videos" && <label>Video poster URL<input value={draft.poster} onChange={event => updateDraft("poster", event.target.value)} /></label>}
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
            <button type="submit" disabled={isSavingMedia}>{isSavingMedia ? "Saving..." : editingId ? "Save media changes" : "Create media"}</button>
          </form>
          </div>
        </Panel>
      </section>
    </section>
  );
}

function SettingsView({ snapshot }: { snapshot: PlatformSnapshot }) {
  const [wellnessGuidesEnabled, setWellnessGuidesEnabled] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(true);
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    void fetch("/api/admin/settings", { headers: adminRequestHeaders(), cache: "no-store" })
      .then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setWellnessGuidesEnabled(payload.data.wellnessGuidesEnabled); })
      .catch(error => setSettingsMessage(error.message))
      .finally(() => setSettingsBusy(false));
  }, []);

  async function updateWellnessGuidesVisibility(enabled: boolean) {
    setSettingsBusy(true); setSettingsMessage("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { ...adminRequestHeaders(), "content-type": "application/json" }, body: JSON.stringify({ wellnessGuidesEnabled: enabled }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setWellnessGuidesEnabled(payload.data.wellnessGuidesEnabled);
      setSettingsMessage("Saved to Neon. This setting applies to all visitors.");
    } catch (error) { setSettingsMessage(error instanceof Error ? error.message : "Unable to save settings."); }
    finally { setSettingsBusy(false); }
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
              disabled={settingsBusy}
              onChange={(event) => updateWellnessGuidesVisibility(event.target.checked)}
              aria-label="Show wellness guides feature on homepage"
            />
            <i aria-hidden="true" />
          </label>
          {settingsMessage && <p role="status">{settingsMessage}</p>}
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
  onView,
  onEdit,
  onDelete
}: {
  products: PlatformSnapshot["products"];
  currency: string;
  onView?: (product: Product) => void;
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
                <button type="button" className="shea-admin-product-cell" onClick={() => onView?.(product)} disabled={!onView} aria-label={onView ? `View ${product.title} details` : undefined}>
                  <StorefrontImage src={product.imageUrl} alt="" />
                  <div>
                    <strong>{product.title}</strong>
                    <small>{product.deliveryBadge}</small>
                  </div>
                </button>
              </td>
              <td>{product.category}</td>
              <td><span className={clsx("shea-admin-status", product.status)}>{titleCase(product.status)}</span></td>
              <td>{product.inventoryQty}</td>
              <td className="shea-admin-price-cell">
                <strong>{productDisplayPrice(product, currency)}</strong>
                <small>{product.sizes.length} {product.sizes.length === 1 ? "option" : "options"}</small>
              </td>
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
