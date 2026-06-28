"use client";

import {
  BarChart3,
  BookOpen,
  Boxes,
  CheckCircle2,
  ClipboardList,
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
  Sparkles,
  Star,
  Store,
  Truck,
  Users
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { formatMoney, titleCase } from "@/lib/format";
import {
  sheaBlogTopics,
  sheaBrand,
  sheaCatalogueDownload,
  sheaProductCategories,
  sheaQuality,
  sheaSocialProof,
  sheaSustainability,
  sheaVideos,
  sheaWholesale
} from "@/lib/shea-content";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";
import type { PlatformSnapshot, Product, ProductStatus } from "@/lib/types";

const adminNav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "products", label: "Products", icon: Boxes },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "wholesale", label: "Wholesale", icon: Store },
  { id: "content", label: "Content", icon: FileText },
  { id: "quality", label: "Quality", icon: ShieldCheck },
  { id: "media", label: "Media", icon: Image },
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

export function AdminShell({ snapshot }: { snapshot: PlatformSnapshot }) {
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof productFilters)[number]>("all");
  const [managedProducts, setManagedProducts] = useState<Product[]>(snapshot.products);
  const [runtimeOrders, setRuntimeOrders] = useState<RuntimeOrder[]>([]);
  const [runtimeReviews, setRuntimeReviews] = useState<RuntimeReview[]>([]);
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

    const savedProducts = window.localStorage.getItem("sheaWellnessProducts");
    if (!savedProducts) return;

    try {
      const parsedProducts = JSON.parse(savedProducts) as Product[];
      if (Array.isArray(parsedProducts)) {
        setManagedProducts(parsedProducts);
      }
    } catch {
      setManagedProducts(snapshot.products);
    }
  }, []);

  function saveManagedProducts(nextProducts: Product[]) {
    setManagedProducts(nextProducts);
    window.localStorage.setItem("sheaWellnessProducts", JSON.stringify(nextProducts));
  }

  const adminOrders = runtimeOrders;

  return (
    <>
      <SheaGlobalHeader />
      <div className="shea-admin">
      <aside className="shea-admin-sidebar">
        <div className="shea-admin-brand">
          <div>S</div>
          <span>Shea Wellness LTD</span>
          <small>Enterprise commerce dashboard</small>
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

        <div className="shea-admin-contact">
          <span>Business enquiries</span>
          <strong>{sheaBrand.phone}</strong>
          <small>{sheaBrand.email}</small>
        </div>
      </aside>

      <main className="shea-admin-main">
        <header className="shea-admin-topbar">
          <label>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Shea products, orders, buyers" />
          </label>
          <a href="/" target="_blank" rel="noreferrer">View Storefront</a>
          <button type="button" onClick={() => setView("products")}><PackagePlus size={17} /> Add product</button>
        </header>

        {view === "overview" ? <OverviewView snapshot={snapshot} products={filteredProducts} orders={adminOrders} reviews={runtimeReviews} setView={setView} /> : null}
        {view === "orders" ? <OrdersView snapshot={snapshot} orders={adminOrders} /> : null}
        {view === "products" ? <ProductsView products={filteredProducts} allProducts={managedProducts} storeId={activeStore.id} filter={filter} setFilter={setFilter} saveProducts={saveManagedProducts} /> : null}
        {view === "reviews" ? <ReviewsView products={managedProducts} reviews={runtimeReviews} /> : null}
        {view === "wholesale" ? <WholesaleView /> : null}
        {view === "content" ? <ContentView /> : null}
        {view === "quality" ? <QualityView /> : null}
        {view === "media" ? <MediaView /> : null}
        {view === "settings" ? <SettingsView snapshot={snapshot} /> : null}
      </main>
      </div>
    </>
  );
}

function OverviewView({
  snapshot,
  products,
  orders,
  reviews,
  setView
}: {
  snapshot: PlatformSnapshot;
  products: PlatformSnapshot["products"];
  orders: RuntimeOrder[];
  reviews: RuntimeReview[];
  setView: (view: View) => void;
}) {
  return (
    <section className="shea-admin-stack">
      <AdminHeading
        eyebrow="Today"
        title="Shea Wellness command center"
        action={<span className="shea-admin-health"><Sparkles size={16} /> Shea-only dashboard</span>}
      />

      <div className="shea-admin-metrics">
        {[
          { label: "Storefront products", value: String(products.length), detail: "Live products currently shown in Shea Wellness." },
          { label: "Orders captured", value: String(orders.length), detail: "Checkout orders available to this dashboard." },
          { label: "Customer reviews", value: String(reviews.length), detail: "Reviews submitted from the storefront." },
          { label: "Gross sales", value: formatMoney(orders.reduce((sum, order) => sum + order.totalPrice, 0), snapshot.activeStore.currency), detail: "Total from captured and current order queue." }
        ].map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </div>

      <section className="shea-admin-grid wide-left">
        <Panel title="Product health" description="Retail, spa, and distributor catalogue status." action={<button onClick={() => setView("products")}>Manage</button>}>
          <ProductTable products={products.slice(0, 7)} currency={snapshot.activeStore.currency} />
        </Panel>
        <Panel title="Fulfillment queue" description="Priority Shea Wellness orders.">
          <div className="shea-admin-list">
            {orders.map((order) => (
              <article key={`${order.orderNumber}-${order.createdAt}`}>
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span>{order.customerName}</span>
                </div>
                <div>
                  <strong>{formatMoney(order.totalPrice, snapshot.activeStore.currency)}</strong>
                  <span>{titleCase(order.fulfillmentStatus)}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section className="shea-admin-grid three">
        <MiniPanel icon={<Store size={20} />} title="Wholesale ready" body="International retailers, wellness spas, organic beauty stores, and distributors are all covered." />
        <MiniPanel icon={<Leaf size={20} />} title="Sustainability covered" body="Women cooperatives, ethical sourcing, natural ingredients, and eco packaging are live." />
        <MiniPanel icon={<ClipboardList size={20} />} title="Content complete" body="Homepage, About, Products, Wholesale, Sustainability, Blog, Quality, Contact, Catalogue, and Social Proof routes exist." />
      </section>

      <Panel title="Product films" description="Actual Shea Wellness videos are available inside the dashboard, not just the public catalogue." action={<button onClick={() => setView("media")}>Open media</button>}>
        <div className="shea-video-slider overview">
          {sheaVideos.slice(0, 3).map((video) => (
            <article key={video.src}>
              <video src={video.src} autoPlay muted loop playsInline preload="metadata" />
              <span>{video.tag}</span>
              <strong>{video.title}</strong>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function ProductsView({
  products,
  allProducts,
  storeId,
  filter,
  setFilter,
  saveProducts
}: {
  products: PlatformSnapshot["products"];
  allProducts: PlatformSnapshot["products"];
  storeId: string;
  filter: (typeof productFilters)[number];
  setFilter: (filter: (typeof productFilters)[number]) => void;
  saveProducts: (products: Product[]) => void;
}) {
  const [draft, setDraft] = useState<ProductFormState>(() => productToDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const categoryOptions = Array.from(new Set([...allProducts.map((product) => product.category), "Body Care", "Face Care", "Hair Care", "Essential Oils"]));

  function updateDraft(field: keyof ProductFormState, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setDraft(productToDraft());
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setDraft(productToDraft(product));
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
        eyebrow="Catalogue"
        title="Shea Wellness storefront CRUD"
        action={<ProductFilter filter={filter} setFilter={setFilter} />}
      />
      <section className="shea-admin-grid wide-left">
        <Panel title="Live storefront products" description="Create, edit, archive, and remove products that customers see in the shop.">
          <ProductTable products={products} currency="KES" onEdit={startEdit} onDelete={deleteProduct} />
        </Panel>
        <Panel
          title={editingId ? "Modify product" : "Add product"}
          description="Updates save locally and refresh the customer storefront in this browser."
          action={<button type="button" onClick={startCreate}>New product</button>}
        >
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
            <label>
              Image URL
              <input required value={draft.imageUrl} onChange={(event) => updateDraft("imageUrl", event.target.value)} placeholder="/assets/sheawellness/product.jpeg" />
            </label>
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
            <button type="submit">{editingId ? "Save product changes" : "Create product"}</button>
          </form>
        </Panel>
      </section>
      <div className="shea-admin-product-grid">
        {products.map((product) => (
          <article key={product.id}>
            <img src={product.imageUrl} alt={product.title} />
            <span>{product.category}</span>
            <strong>{product.title}</strong>
            <p>{product.description}</p>
            <div>
              <button type="button" onClick={() => startEdit(product)}>Edit</button>
              <button type="button" className="danger" onClick={() => deleteProduct(product.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </section>
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

function MediaView() {
  return (
    <section className="shea-admin-stack">
      <AdminHeading eyebrow="Brand media" title="Product image and video library" />
      <div className="shea-admin-media-grid">
        {[
          "/assets/sheawellness/pure-raw-shea-butter.jpeg",
          "/assets/sheawellness/lavender-shea-butter-front.jpeg",
          "/assets/sheawellness/lemongrass-shea-butter-front.jpeg",
          "/assets/sheawellness/grapefruit-shea-butter-front.jpeg",
          "/assets/sheawellness/vanilla-mint-shea-butter.jpeg",
          "/assets/sheawellness/lavender-shea-butter-back.jpeg"
        ].map((src) => (
          <article key={src}><img src={src} alt="" /><span>{src.split("/").pop()}</span></article>
        ))}
      </div>
      <div className="shea-video-slider">
        {sheaVideos.map((video) => (
          <article key={video.src}>
            <video src={video.src} autoPlay muted loop playsInline preload="metadata" />
            <span>{video.tag}</span>
            <strong>{video.title}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsView({ snapshot }: { snapshot: PlatformSnapshot }) {
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
