import { NextResponse, type NextRequest } from "next/server";
import { catalogRepository } from "@/server/repositories/catalogRepository";
import { productCreateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const storeId = request.headers.get("x-tenant-id") ?? "store_urban";
  const products = await catalogRepository.listProducts(storeId);

  return NextResponse.json({ data: products });
}

export async function POST(request: NextRequest) {
  const storeId = request.headers.get("x-tenant-id") ?? "store_urban";
  const payload = productCreateSchema.parse(await request.json());
  const product = await catalogRepository.createProduct(storeId, payload);

  return NextResponse.json({ data: product }, { status: 201 });
}
