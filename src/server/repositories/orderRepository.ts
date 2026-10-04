import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/types";

const STORE_KEY = "shea-wellness";

export type CheckoutPaymentMethod = "card" | "paypal" | "mpesa";

export type OrderCustomer = {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  deliveryMethod: "kenya" | "international";
};

export type OrderLine = {
  productId: string;
  title: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type StorefrontOrder = {
  id: string;
  storeId: string;
  orderNumber: string;
  requestId: string;
  customer: OrderCustomer;
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: "KES";
  paymentMethod: CheckoutPaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  placedAt: string;
  updatedAt: string;
};

export type CreateOrderInput = Omit<StorefrontOrder, "id" | "orderNumber" | "paymentStatus" | "fulfillmentStatus" | "placedAt" | "updatedAt">;

export class OrderRequestConflictError extends Error {
  constructor() {
    super("This checkout request identifier was already used for different order details.");
    this.name = "OrderRequestConflictError";
  }
}

type OrderRow = {
  id: string;
  store_id: string;
  order_number: string;
  request_id: string;
  customer: unknown;
  items: unknown;
  subtotal: number | string;
  shipping: number | string;
  tax: number | string;
  total: number | string;
  currency: "KES";
  payment_method: CheckoutPaymentMethod;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  created_at: string | Date;
  updated_at: string | Date;
};

function database() {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? neon(connectionString) : null;
}

let tableReady: Promise<void> | null = null;

async function ensureTable(sql: NonNullable<ReturnType<typeof database>>) {
  if (!tableReady) {
    tableReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS storefront_orders (
          id TEXT PRIMARY KEY,
          store_key TEXT NOT NULL,
          store_id TEXT NOT NULL,
          order_number TEXT NOT NULL UNIQUE,
          request_id TEXT NOT NULL UNIQUE,
          customer JSONB NOT NULL,
          items JSONB NOT NULL,
          subtotal NUMERIC(12, 2) NOT NULL,
          shipping NUMERIC(12, 2) NOT NULL,
          tax NUMERIC(12, 2) NOT NULL,
          total NUMERIC(12, 2) NOT NULL,
          currency TEXT NOT NULL DEFAULT 'KES',
          payment_method TEXT NOT NULL,
          payment_status TEXT NOT NULL DEFAULT 'pending',
          fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS storefront_orders_store_created_idx
        ON storefront_orders (store_key, created_at DESC)
      `;
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }

  await tableReady;
}

function parseJson<T>(value: unknown): T {
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }
  return value as T;
}

function asAmount(value: number | string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function asIsoDate(value: string | Date) {
  return new Date(value).toISOString();
}

function fromRow(row: OrderRow): StorefrontOrder {
  return {
    id: row.id,
    storeId: row.store_id,
    orderNumber: row.order_number,
    requestId: row.request_id,
    customer: parseJson<OrderCustomer>(row.customer),
    items: parseJson<OrderLine[]>(row.items),
    subtotal: asAmount(row.subtotal),
    shipping: asAmount(row.shipping),
    tax: asAmount(row.tax),
    total: asAmount(row.total),
    currency: row.currency,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    placedAt: asIsoDate(row.created_at),
    updatedAt: asIsoDate(row.updated_at)
  };
}

function nextOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `SHEA-${timestamp}-${suffix}`;
}

function sameOrderRequest(order: StorefrontOrder, input: CreateOrderInput) {
  const sameCustomer = order.customer.email === input.customer.email
    && order.customer.fullName === input.customer.fullName
    && order.customer.phone === input.customer.phone
    && order.customer.address === input.customer.address
    && order.customer.country === input.customer.country
    && order.customer.city === input.customer.city
    && order.customer.deliveryMethod === input.customer.deliveryMethod;
  const sameItems = order.items.length === input.items.length
    && order.items.every((item, index) => {
      const candidate = input.items[index];
      return candidate
        && item.productId === candidate.productId
        && item.title === candidate.title
        && item.size === candidate.size
        && item.quantity === candidate.quantity
        && item.unitPrice === candidate.unitPrice
        && item.lineTotal === candidate.lineTotal;
    });

  return order.storeId === input.storeId
    && order.currency === input.currency
    && order.paymentMethod === input.paymentMethod
    && order.subtotal === input.subtotal
    && order.shipping === input.shipping
    && order.tax === input.tax
    && order.total === input.total
    && sameCustomer
    && sameItems;
}

function reuseMatchingOrder(order: StorefrontOrder, input: CreateOrderInput) {
  if (!sameOrderRequest(order, input)) throw new OrderRequestConflictError();
  return { order, created: false } as const;
}

async function findOrderByRequestId(
  sql: NonNullable<ReturnType<typeof database>>,
  requestId: string
) {
  const rows = await sql`
    SELECT id, store_id, order_number, request_id, customer, items, subtotal, shipping, tax, total,
      currency, payment_method, payment_status, fulfillment_status, created_at, updated_at
    FROM storefront_orders
    WHERE store_key = ${STORE_KEY} AND request_id = ${requestId}
    LIMIT 1
  `;

  return rows.length ? fromRow(rows[0] as OrderRow) : null;
}

export async function createOrder(input: CreateOrderInput): Promise<{ order: StorefrontOrder; created: boolean }> {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured for checkout.");

  await ensureTable(sql);

  const existingOrder = await findOrderByRequestId(sql, input.requestId);
  if (existingOrder) return reuseMatchingOrder(existingOrder, input);

  const id = randomUUID();
  const orderNumber = nextOrderNumber();

  try {
    const rows = await sql`
      INSERT INTO storefront_orders (
        id, store_key, store_id, order_number, request_id, customer, items,
        subtotal, shipping, tax, total, currency, payment_method
      )
      VALUES (
        ${id}, ${STORE_KEY}, ${input.storeId}, ${orderNumber}, ${input.requestId},
        ${JSON.stringify(input.customer)}::jsonb, ${JSON.stringify(input.items)}::jsonb,
        ${input.subtotal}, ${input.shipping}, ${input.tax}, ${input.total}, ${input.currency}, ${input.paymentMethod}
      )
      RETURNING id, store_id, order_number, request_id, customer, items, subtotal, shipping, tax, total,
        currency, payment_method, payment_status, fulfillment_status, created_at, updated_at
    `;

    return { order: fromRow(rows[0] as OrderRow), created: true };
  } catch (error) {
    // A retried request can race after the preflight lookup. The database's
    // unique key remains the authority; return the first saved order instead
    // of creating a duplicate or reporting a false checkout failure.
    const savedOrder = await findOrderByRequestId(sql, input.requestId);
    if (savedOrder) return reuseMatchingOrder(savedOrder, input);
    throw error;
  }
}

export async function listOrders(limit = 100): Promise<StorefrontOrder[]> {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured for orders.");

  await ensureTable(sql);
  const rows = await sql`
    SELECT id, store_id, order_number, request_id, customer, items, subtotal, shipping, tax, total,
      currency, payment_method, payment_status, fulfillment_status, created_at, updated_at
    FROM storefront_orders
    WHERE store_key = ${STORE_KEY}
    ORDER BY created_at DESC
    LIMIT ${Math.min(Math.max(limit, 1), 250)}
  `;

  return rows.map((row) => fromRow(row as OrderRow));
}

export async function updateOrderStatus(input: {
  id: string;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
}): Promise<StorefrontOrder | null> {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured for orders.");

  await ensureTable(sql);

  let rows: unknown[];
  if (input.paymentStatus && input.fulfillmentStatus) {
    rows = await sql`
      UPDATE storefront_orders
      SET payment_status = ${input.paymentStatus}, fulfillment_status = ${input.fulfillmentStatus}, updated_at = NOW()
      WHERE id = ${input.id} AND store_key = ${STORE_KEY}
      RETURNING id, store_id, order_number, request_id, customer, items, subtotal, shipping, tax, total,
        currency, payment_method, payment_status, fulfillment_status, created_at, updated_at
    `;
  } else if (input.paymentStatus) {
    rows = await sql`
      UPDATE storefront_orders
      SET payment_status = ${input.paymentStatus}, updated_at = NOW()
      WHERE id = ${input.id} AND store_key = ${STORE_KEY}
      RETURNING id, store_id, order_number, request_id, customer, items, subtotal, shipping, tax, total,
        currency, payment_method, payment_status, fulfillment_status, created_at, updated_at
    `;
  } else if (input.fulfillmentStatus) {
    rows = await sql`
      UPDATE storefront_orders
      SET fulfillment_status = ${input.fulfillmentStatus}, updated_at = NOW()
      WHERE id = ${input.id} AND store_key = ${STORE_KEY}
      RETURNING id, store_id, order_number, request_id, customer, items, subtotal, shipping, tax, total,
        currency, payment_method, payment_status, fulfillment_status, created_at, updated_at
    `;
  } else {
    throw new Error("At least one order status must be provided.");
  }

  return rows.length ? fromRow(rows[0] as OrderRow) : null;
}
