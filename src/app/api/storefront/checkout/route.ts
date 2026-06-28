import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
  customer: z.object({
    email: z.string().email(),
    fullName: z.string().min(2),
    address: z.string().min(4),
    city: z.string().min(2),
    postalCode: z.string().optional(),
    deliveryMethod: z.enum(["standard", "express"]),
    paymentMethod: z.enum(["card", "paypal"])
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      title: z.string(),
      quantity: z.number().int().positive(),
      size: z.string(),
      unitPrice: z.number().nonnegative()
    })
  ).min(1),
  totals: z.object({
    subtotal: z.number().nonnegative(),
    shipping: z.number().nonnegative(),
    tax: z.number().nonnegative(),
    total: z.number().positive()
  })
});

export async function POST(request: Request) {
  const checkout = checkoutSchema.parse(await request.json());
  const suffix = Math.floor(100000 + Math.random() * 900000);

  return NextResponse.json({
    data: {
      orderNumber: `SHEA-${suffix}`,
      paymentStatus: "authorized",
      fulfillmentStatus: "unfulfilled",
      customerEmail: checkout.customer.email,
      itemCount: checkout.items.reduce((total, item) => total + item.quantity, 0),
      total: checkout.totals.total
    }
  }, { status: 201 });
}
