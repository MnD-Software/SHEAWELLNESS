import { NextResponse } from "next/server";
import { z } from "zod";
import { listOrders, updateOrderStatus } from "@/server/repositories/orderRepository";
import { requireAdminAccess } from "@/server/adminAuth";

export const dynamic = "force-dynamic";

const statusUpdateSchema = z.object({
  id: z.string().trim().min(1).max(128),
  paymentStatus: z.enum(["paid", "pending", "authorized", "refunded", "failed"]).optional(),
  fulfillmentStatus: z.enum(["unfulfilled", "partial", "fulfilled", "on_hold"]).optional()
}).refine((value) => value.paymentStatus || value.fulfillmentStatus, {
  message: "At least one order status must be provided."
});

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (message.includes("DATABASE_URL")) {
    return NextResponse.json({ error: "The order workspace is not configured yet." }, { status: 503 });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export async function GET(request: Request) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;

  try {
    const rawLimit = new URL(request.url).searchParams.get("limit");
    const limit = rawLimit ? Number(rawLimit) : 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
      return NextResponse.json({ error: "limit must be an integer between 1 and 250." }, { status: 400 });
    }
    return NextResponse.json({ data: await listOrders(limit) });
  } catch (error) {
    return errorResponse(error, "Unable to load orders.");
  }
}

export async function PATCH(request: Request) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;

  try {
    const input = statusUpdateSchema.parse(await request.json());
    const order = await updateOrderStatus(input);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ data: order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Please provide a valid order status update." }, { status: 400 });
    }
    return errorResponse(error, "Unable to update the order.");
  }
}
