import { NextResponse, type NextRequest } from "next/server";
import { platformSnapshot } from "@/lib/platform-data";

export async function GET(request: NextRequest) {
  const storeId = request.headers.get("x-tenant-id") ?? "store_urban";
  const orders = platformSnapshot.orders.filter((order) => order.storeId === storeId);

  return NextResponse.json({ data: orders });
}
