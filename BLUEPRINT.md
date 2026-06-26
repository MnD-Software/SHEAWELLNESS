# MerchantOS Commerce Platform Blueprint

This workspace now contains an enterprise-grade TypeScript/Next.js platform foundation for a self-hosted, multi-tenant commerce system. The codebase is shaped as a real product: tenant resolution, database schema, admin experience, storefront renderer, API route contracts, and theme layout data are all represented in source code.

## Production Architecture

- Frontend: Next.js app router for admin and storefront, with server-side tenant resolution and edge caching for public storefront pages.
- Backend: Node.js/NestJS or Go API services for catalog, checkout, orders, customers, discounts, webhooks, and theme publishing.
- Data: PostgreSQL as the system of record, Redis for sessions, cache, rate limits, queues, and inventory reservation locks.
- Search: Meilisearch, Typesense, or OpenSearch for product and order search.
- Assets: S3-compatible object storage behind a CDN for product media, themes, exports, and merchant uploads.
- Jobs: BullMQ, Temporal, or Faktory for fulfillment webhooks, payment callbacks, exports, search indexing, and domain verification.
- Observability: OpenTelemetry traces, structured logs, metrics, uptime checks, and audit trails for admin actions.

## Tenant Isolation

Use a shared PostgreSQL database with strict `store_id` scoping for the core platform until enterprise tenants require dedicated databases. This gives strong operational simplicity, high cache locality, and easier analytics.

Required safeguards:

- Every tenant-owned table has a non-null `store_id`.
- Every hot query has a composite index beginning with `store_id`.
- API middleware resolves the tenant from the authenticated session or request host.
- Repository methods require `store_id`; no unscoped reads.
- PostgreSQL row level security can be added for another enforcement layer.
- Enterprise plan can move large tenants to a dedicated schema or database through a routing table.

## Domain Mapping

1. Merchant creates a store with `subdomain.myplatform.com`.
2. Merchant optionally adds `customdomain.com`.
3. Platform asks merchant to add a CNAME to `domains.myplatform.com`.
4. A domain verification job checks DNS and stores verification status.
5. Reverse proxy receives the request host and forwards to the app.
6. Tenant resolver maps `Host` to `stores.domain` or `stores.custom_domain`.
7. Storefront renders the correct tenant theme, products, collections, and checkout.

## Core PostgreSQL DDL

```sql
create table stores (
  id uuid primary key,
  name text not null,
  domain text unique not null,
  custom_domain text unique,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key,
  store_id uuid not null references stores(id) on delete cascade,
  email citext not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  unique (store_id, email)
);

create table products (
  id uuid primary key,
  store_id uuid not null references stores(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  inventory_qty integer not null default 0 check (inventory_qty >= 0),
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table orders (
  id uuid primary key,
  store_id uuid not null references stores(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  total_price numeric(12,2) not null check (total_price >= 0),
  payment_status text not null default 'pending',
  fulfillment_status text not null default 'unfulfilled',
  created_at timestamptz not null default now()
);

create index products_store_status_idx on products(store_id, status);
create index orders_store_created_idx on orders(store_id, created_at desc);
create index orders_store_payment_idx on orders(store_id, payment_status);
```

## Theme Engine Model

The application includes a working typed JSON renderer in `src/lib/theme-engine.tsx`. A production database table would store draft and published versions:

```sql
create table themes (
  id uuid primary key,
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  status text not null default 'draft',
  layout jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Example layout:

```json
{
  "sections": [
    {
      "type": "header",
      "settings": {
        "brand": "Urban Supply Co.",
        "nav": ["New arrivals", "Bestsellers", "Journal"]
      }
    },
    {
      "type": "hero",
      "settings": {
        "headline": "Designed essentials for modern retail.",
        "body": "A polished storefront rendered from merchant-owned section JSON.",
        "cta": "Shop featured"
      }
    },
    {
      "type": "featured_collection",
      "settings": {
        "title": "Featured collection",
        "products": ["Modular Canvas Tote", "Studio Ceramic Lamp"]
      }
    }
  ]
}
```

## Next Build Phase

1. Install dependencies and run the app locally.
2. Connect PostgreSQL and run Prisma migrations.
3. Replace seeded UI data with repository calls.
4. Add authentication, RBAC, audit logging, and checkout payment adapters.
5. Add merchant onboarding, domain verification, and a theme publishing workflow.

## Storefront Flow Implemented

The public storefront now follows a full ecommerce journey:

1. Editorial homepage hero with visible store promise, trust signals, and shopping CTAs.
2. Collection/category discovery for faster product finding.
3. Product listing page behavior with search, category filters, sorting, ratings, pricing, and quick-add.
4. Product detail modal with product imagery, variants, delivery notes, material details, reviews, and return reassurance.
5. Cart drawer with line-item quantities, subtotal, and clear checkout entry.
6. Guest checkout with contact/address, delivery method, payment method, final review, and confirmation.
7. Storefront APIs for live products and checkout order creation contracts.

This flow is based on a practical synthesis of leading commerce references:

- Baymard checkout research: account selection/guest checkout, address information, shipping, payment, review, and confirmation are treated as explicit steps.
- Baymard product-page research: product confidence is supported through images, reviews, delivery, returns, variants, price clarity, and material details.
- Shopify Dawn: source-available theme architecture and performance restraint informed the simple, fast storefront shell.
- Vercel Commerce and Medusa Next.js starter: Next.js storefront architecture influenced the App Router commerce structure.
- Saleor storefront: API-driven product and checkout contracts informed the storefront API route shape.
