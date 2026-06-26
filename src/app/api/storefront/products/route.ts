import { NextResponse, type NextRequest } from "next/server";
import { platformSnapshot } from "@/lib/platform-data";

export async function GET(request: NextRequest) {
  const storeId = request.headers.get("x-tenant-id") ?? platformSnapshot.activeStore.id;
  const products = platformSnapshot.products.filter((product) => {
    return product.storeId === storeId && (product.status === "active" || product.status === "low_stock");
  });

  return NextResponse.json({ data: products });
}
