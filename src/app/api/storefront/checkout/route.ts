import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
  customer: z.object({
    email: z.string().email(),
    fullName: z.string().min(2),
    phone: z.string().min(6),
    address: z.string().min(4),
    country: z.string().min(2),
    city: z.string().min(2),
    deliveryMethod: z.enum(["kenya", "international"]),
    paymentMethod: z.enum(["card", "paypal", "mpesa"])
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
      // This endpoint records an order request only. A gateway/PayBill
      // integration must confirm payment before an order can be marked paid.
      paymentStatus: "pending",
      fulfillmentStatus: "unfulfilled",
      customerEmail: checkout.customer.email,
      itemCount: checkout.items.reduce((total, item) => total + item.quantity, 0),
      total: checkout.totals.total
    }
  }, { status: 201 });
}
