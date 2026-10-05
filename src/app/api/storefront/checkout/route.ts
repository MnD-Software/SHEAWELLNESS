import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { platformSnapshot } from "@/lib/platform-data";
import type { Product } from "@/lib/types";
import {
  createOrder,
  OrderRequestConflictError,
  type OrderLine,
  type StorefrontOrder
} from "@/server/repositories/orderRepository";
import { getStoreContent } from "@/server/repositories/storeContentRepository";

export const dynamic = "force-dynamic";

// Legacy clients may still send line titles, prices, and totals. Zod strips
// those extra fields so the catalogue, not the browser, remains the price
// authority.
const checkoutSchema = z.object({
  requestId: z.string().trim().min(16).max(128).optional(),
  customer: z.object({
    email: z.string().trim().email().max(254),
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(6).max(40),
    address: z.string().trim().min(4).max(240),
    country: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(100),
    deliveryMethod: z.enum(["kenya", "international"]),
    paymentMethod: z.enum(["card", "paypal", "mpesa"])
  }),
  items: z.array(
    z.object({
      productId: z.string().trim().min(1).max(120),
      quantity: z.number().int().positive().max(25),
      size: z.string().trim().min(1).max(120)
    })
  ).min(1).max(20)
});

type CheckoutInput = z.infer<typeof checkoutSchema>;

class CheckoutValidationError extends Error {}

function toMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function priceForSize(product: Product, size: string) {
  const candidate = product.sizePrices?.[size] ?? product.price;
  const price = Number(candidate);
  if (!Number.isFinite(price) || price < 0) {
    throw new CheckoutValidationError(`${product.title} does not have a valid price for the selected option.`);
  }
  return toMoney(price);
}

function canonicalLines(items: CheckoutInput["items"], products: Product[]): OrderLine[] {
  const quantities = new Map<string, { productId: string; size: string; quantity: number }>();

  for (const item of items) {
    const key = `${item.productId}\u0000${item.size}`;
    const existing = quantities.get(key);
    const quantity = (existing?.quantity ?? 0) + item.quantity;
    if (quantity > 25) {
      throw new CheckoutValidationError("A maximum of 25 units is allowed for each product option per order.");
    }
    quantities.set(key, { productId: item.productId, size: item.size, quantity });
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  return [...quantities.values()].map((item) => {
    const product = productById.get(item.productId);
    if (!product || product.storeId !== platformSnapshot.activeStore.id) {
      throw new CheckoutValidationError("One or more products in your cart are no longer available.");
    }
    if (product.status !== "active" && product.status !== "low_stock") {
      throw new CheckoutValidationError(`${product.title} is not currently available to order.`);
    }
    if (product.channel !== "online" && product.channel !== "both") {
      throw new CheckoutValidationError(`${product.title} is not currently available for online checkout.`);
    }
    if (!product.sizes.includes(item.size)) {
      throw new CheckoutValidationError(`${product.title} no longer offers the selected option.`);
    }
    if (!Number.isFinite(product.inventoryQty) || product.inventoryQty < item.quantity) {
      throw new CheckoutValidationError(`${product.title} does not have enough stock for the requested quantity.`);
    }

    const unitPrice = priceForSize(product, item.size);
    return {
      productId: product.id,
      title: product.title,
      size: item.size,
      quantity: item.quantity,
      unitPrice,
      lineTotal: toMoney(unitPrice * item.quantity)
    };
  });
}

function checkoutResponse(order: StorefrontOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    requestId: order.requestId,
    customerEmail: order.customer.email,
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    placedAt: order.placedAt
  };
}

export async function POST(request: Request) {
  try {
    const checkout = checkoutSchema.parse(await request.json());
    const content = await getStoreContent({ strict: true });
    const items = canonicalLines(checkout.items, content.products);
    const subtotal = toMoney(items.reduce((total, item) => total + item.lineTotal, 0));

    // Delivery, duty, and tax stay at zero until the address is reviewed.
    // This matches the checkout copy and prevents fabricated charge estimates.
    const shipping = 0;
    const tax = 0;
    const result = await createOrder({
      storeId: platformSnapshot.activeStore.id,
      requestId: checkout.requestId ?? randomUUID(),
      customer: {
        email: checkout.customer.email,
        fullName: checkout.customer.fullName,
        phone: checkout.customer.phone,
        address: checkout.customer.address,
        country: checkout.customer.country,
        city: checkout.customer.city,
        deliveryMethod: checkout.customer.deliveryMethod
      },
      items,
      subtotal,
      shipping,
      tax,
      total: toMoney(subtotal + shipping + tax),
      currency: "KES",
      paymentMethod: checkout.customer.paymentMethod
    });

    return NextResponse.json({ data: checkoutResponse(result.order) }, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Please check the checkout information and try again." }, { status: 400 });
    }
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    if (error instanceof OrderRequestConflictError) {
      return NextResponse.json(
        { error: "This checkout session no longer matches your cart. Refresh checkout and try again." },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Unable to create the order.";
    if (message.includes("DATABASE_URL") || message.includes("fetch failed") || message.includes("connecting to database")) {
      return NextResponse.json({ error: "Checkout is temporarily unavailable. Please contact Shea Wellness to place your order." }, { status: 503 });
    }
    return NextResponse.json({ error: "Unable to create the order. Please try again shortly." }, { status: 500 });
  }
}
