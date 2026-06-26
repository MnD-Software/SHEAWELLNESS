"use client";

import {
  BarChart3,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Home,
  LayoutTemplate,
  Megaphone,
  PackagePlus,
  Percent,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Users
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { formatMoney, titleCase } from "@/lib/format";
import { StorefrontRenderer } from "@/lib/theme-engine";
import type { PlatformSnapshot, ProductStatus } from "@/lib/types";

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Boxes },
  { id: "customers", label: "Customers", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "discounts", label: "Discounts", icon: Percent },
  { id: "storefront", label: "Online Store", icon: LayoutTemplate },
  { id: "settings", label: "Settings", icon: Settings }
] as const;

const productFilters: Array<"all" | ProductStatus> = ["all", "active", "draft", "low_stock"];

type AdminShellProps = {
  snapshot: PlatformSnapshot;
};

export function AdminShell({ snapshot }: AdminShellProps) {
  const [view, setView] = useState("home");
  const [storeId, setStoreId] = useState(snapshot.activeStore.id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof productFilters)[number]>("all");

  const activeStore = snapshot.stores.find((store) => store.id === storeId) ?? snapshot.activeStore;

  const filteredProducts = useMemo(() => {
    return snapshot.products.filter((product) => {
      const matchesStore = product.storeId === activeStore.id;
      const matchesFilter = filter === "all" || product.status === filter;
      const matchesQuery = product.title.toLowerCase().includes(query.toLowerCase());
      return matchesStore && matchesFilter && matchesQuery;
    });
  }, [activeStore.id, filter, query, snapshot.products]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-row">
          <div className="brand-mark">M</div>
          <div>
            <strong>MerchantOS</strong>
            <span>Enterprise commerce</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.id}
                className={clsx("nav-button", view === item.id && "active")}
                onClick={() => setView(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="tenant-card">
          <span>Tenant</span>
          <strong>{activeStore.name}</strong>
          <small>{activeStore.customDomain ?? activeStore.platformDomain}</small>
        </div>
      </aside>

      <main className="admin-workspace">
        <header className="admin-topbar">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, orders, customers"
            />
          </label>

          <label className="store-switcher">
            <select value={storeId} onChange={(event) => setStoreId(event.target.value)}>
              {snapshot.stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>

          <button type="button" className="secondary-action">
            Export
          </button>
          <button type="button" className="primary-action">
            <PackagePlus size={17} />
            Add product
          </button>
        </header>

        {view === "home" ? (
          <HomeView
            snapshot={snapshot}
            activeStore={activeStore}
            filteredProducts={filteredProducts}
            filter={filter}
            setFilter={setFilter}
            setView={setView}
          />
        ) : null}

        {view === "orders" ? <OrdersView snapshot={snapshot} /> : null}
        {view === "products" ? (
          <ProductsView products={filteredProducts} filter={filter} setFilter={setFilter} />
        ) : null}
        {view === "customers" ? <CustomersView snapshot={snapshot} /> : null}
        {view === "analytics" ? <AnalyticsView /> : null}
        {view === "marketing" ? <MarketingView /> : null}
        {view === "discounts" ? <DiscountsView /> : null}
        {view === "storefront" ? <StorefrontView snapshot={snapshot} activeStore={activeStore} /> : null}
        {view === "settings" ? <SettingsView snapshot={snapshot} activeStore={activeStore} /> : null}
      </main>
    </div>
  );
}

function HomeView({
  snapshot,
  activeStore,
  filteredProducts,
  filter,
  setFilter,
  setView
}: {
  snapshot: PlatformSnapshot;
  activeStore: PlatformSnapshot["activeStore"];
  filteredProducts: PlatformSnapshot["products"];
  filter: (typeof productFilters)[number];
  setFilter: (filter: (typeof productFilters)[number]) => void;
  setView: (view: string) => void;
}) {
  return (
    <section className="view-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Today</span>
          <h1>Commerce command center</h1>
        </div>
        <div className="health-pill">
          <Sparkles size={16} />
          Platform healthy
        </div>
      </div>

      <section className="metric-grid">
        {snapshot.metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="panel panel-wide">
          <PanelHeader
            title="Products"
            description="Inventory, publishing state, sales velocity, and channel readiness."
            action={<ProductFilter filter={filter} setFilter={setFilter} />}
          />
          <ProductsTable products={filteredProducts} currency={activeStore.currency} />
        </div>

        <div className="panel">
          <PanelHeader title="Fulfillment" description="Priority order queue across the active tenant." />
          <div className="order-stack">
            {snapshot.orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span>{order.customerName}</span>
                </div>
                <div>
                  <strong>{formatMoney(order.totalPrice, activeStore.currency)}</strong>
                  <span>{titleCase(order.fulfillmentStatus)}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <PanelHeader
          title="Enterprise platform layers"
          description="The codebase is structured for a full multi-tenant commerce system."
          action={
            <button type="button" className="secondary-action" onClick={() => setView("settings")}>
              View data model
            </button>
          }
        />
        <div className="architecture-grid">
          <ArchitectureCard title="Tenant resolver" body="Host-based middleware maps custom domains and subdomains to the correct store." />
          <ArchitectureCard title="Commerce APIs" body="Typed route handlers define product, order, and theme contracts for the admin." />
          <ArchitectureCard title="PostgreSQL core" body="Prisma schema models stores, users, products, customers, orders, domains, and themes." />
          <ArchitectureCard title="Theme engine" body="Storefront pages render merchant-owned section JSON into production UI." />
        </div>
      </section>
    </section>
  );
}

function ProductsView({
  products,
  filter,
  setFilter
}: {
  products: PlatformSnapshot["products"];
  filter: (typeof productFilters)[number];
  setFilter: (filter: (typeof productFilters)[number]) => void;
}) {
  return (
    <section className="view-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Products</h1>
        </div>
        <button type="button" className="primary-action">
          <PackagePlus size={17} />
          Add product
        </button>
      </div>
      <div className="panel">
        <PanelHeader
          title="Catalog manager"
          description="Search, publish, and manage inventory across storefront and POS channels."
          action={<ProductFilter filter={filter} setFilter={setFilter} />}
        />
        <ProductsTable products={products} currency="USD" />
      </div>
    </section>
  );
}

function OrdersView({ snapshot }: { snapshot: PlatformSnapshot }) {
  return (
    <section className="view-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Operations</span>
          <h1>Orders</h1>
        </div>
        <button type="button" className="primary-action">
          Create order
        </button>
      </div>
      <div className="kanban-grid">
        {["unfulfilled", "partial", "on_hold"].map((status) => (
          <div className="panel" key={status}>
            <PanelHeader title={titleCase(status)} description="Operational work queue" />
            <div className="order-stack">
              {snapshot.orders
                .filter((order) => order.fulfillmentStatus === status)
                .map((order) => (
                  <article className="order-card" key={order.id}>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <span>{order.customerName}</span>
                    </div>
                    <strong>{formatMoney(order.totalPrice)}</strong>
                  </article>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomersView({ snapshot }: { snapshot: PlatformSnapshot }) {
  return (
    <section className="view-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Relationships</span>
          <h1>Customers</h1>
        </div>
        <button type="button" className="secondary-action">Import</button>
      </div>
      <div className="customer-grid">
        {snapshot.customers.map((customer) => (
          <article className="customer-card" key={customer.id}>
            <strong>{customer.name}</strong>
            <span>{customer.email}</span>
            <small>{customer.segment}</small>
            <b>{formatMoney(customer.lifetimeValue)} lifetime value</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function AnalyticsView() {
  return (
    <section className="view-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Insights</span>
          <h1>Analytics</h1>
        </div>
      </div>
      <div className="panel">
        <PanelHeader title="Revenue performance" description="Sales trend, conversion quality, and traffic depth." />
        <div className="chart-card">
          {[46, 61, 52, 82, 67, 74, 88, 71, 93, 84].map((height, index) => (
            <span key={height + index} className={clsx("bar", index === 8 && "highlight")} style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketingView() {
  return (
    <section className="view-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Growth</span>
          <h1>Marketing</h1>
        </div>
      </div>
      <div className="campaign-grid">
        <CampaignCard icon={<Megaphone size={18} />} title="Win-back campaign" body="2,840 customers qualify based on 60-day purchase inactivity." />
        <CampaignCard icon={<CreditCard size={18} />} title="Checkout recovery" body="Abandoned checkout flow is ready for email and SMS automation." />
        <CampaignCard icon={<CircleDollarSign size={18} />} title="Product retargeting" body="Active catalog sync can feed paid social and search campaigns." />
      </div>
    </section>
  );
}

function DiscountsView() {
  return (
    <section className="view-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Pricing</span>
          <h1>Discounts</h1>
        </div>
        <button type="button" className="primary-action">Create discount</button>
      </div>
      <div className="panel">
        {["WELCOME15", "FREESHIP150", "VIP20"].map((code) => (
          <div className="discount-row" key={code}>
            <strong>{code}</strong>
            <span>{code === "FREESHIP150" ? "Free shipping over $150" : "Targeted percentage discount"}</span>
            <small>{code === "VIP20" ? "Scheduled" : "Active"}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function StorefrontView({
  snapshot,
  activeStore
}: {
  snapshot: PlatformSnapshot;
  activeStore: PlatformSnapshot["activeStore"];
}) {
  return (
    <section className="view-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Theme engine</span>
          <h1>Online Store</h1>
        </div>
        <button type="button" className="primary-action">Publish theme</button>
      </div>
      <div className="theme-grid">
        <div className="panel">
          <PanelHeader title="Theme JSON" description="Versioned section data that can be stored as JSONB." />
          <pre className="json-block">{JSON.stringify(snapshot.theme, null, 2)}</pre>
        </div>
        <div className="store-preview">
          <div className="browser-bar">
            <span />
            <strong>{activeStore.customDomain ?? activeStore.platformDomain}</strong>
          </div>
          <StorefrontRenderer store={activeStore} products={snapshot.products} layout={snapshot.theme} />
        </div>
      </div>
    </section>
  );
}

function SettingsView({
  snapshot,
  activeStore
}: {
  snapshot: PlatformSnapshot;
  activeStore: PlatformSnapshot["activeStore"];
}) {
  return (
    <section className="view-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Configuration</span>
          <h1>Settings</h1>
        </div>
      </div>
      <div className="settings-grid">
        <div className="panel">
          <PanelHeader title="Tenant identity" description="Domain and plan settings for the active merchant." />
          <div className="detail-list">
            <Detail label="Store" value={activeStore.name} />
            <Detail label="Platform domain" value={activeStore.platformDomain} />
            <Detail label="Custom domain" value={activeStore.customDomain ?? "Not connected"} />
            <Detail label="Plan" value={titleCase(activeStore.plan)} />
          </div>
        </div>
        <div className="panel">
          <PanelHeader title="Platform inventory" description="What this codebase now contains." />
          <div className="detail-list">
            <Detail label="Stores" value={String(snapshot.stores.length)} />
            <Detail label="Products" value={String(snapshot.products.length)} />
            <Detail label="API routes" value="/api/admin/products, /orders, /theme" />
            <Detail label="Database" value="Prisma PostgreSQL schema" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PanelHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
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
    <div className="segmented-control">
      {productFilters.map((item) => (
        <button
          type="button"
          key={item}
          className={clsx(filter === item && "active")}
          onClick={() => setFilter(item)}
        >
          {titleCase(item)}
        </button>
      ))}
    </div>
  );
}

function ProductsTable({
  products,
  currency
}: {
  products: PlatformSnapshot["products"];
  currency: string;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Status</th>
            <th>Inventory</th>
            <th>Price</th>
            <th>Sales</th>
            <th>Channel</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="product-cell">
                  <span className="product-thumb" />
                  <div>
                    <strong>{product.title}</strong>
                    <small>{product.description}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className={clsx("status-badge", product.status)}>{titleCase(product.status)}</span>
              </td>
              <td>{product.inventoryQty} available</td>
              <td>{formatMoney(product.price, currency)}</td>
              <td>{product.sales}</td>
              <td>{titleCase(product.channel)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArchitectureCard({ title, body }: { title: string; body: string }) {
  return (
    <article>
      <strong>{title}</strong>
      <p>{body}</p>
    </article>
  );
}

function CampaignCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="campaign-card">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{body}</p>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
