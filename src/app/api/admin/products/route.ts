import { NextResponse, type NextRequest } from "next/server";
import { catalogRepository } from "@/server/repositories/catalogRepository";
import { productCreateSchema } from "@/lib/validation";
import { requireAdminAccess } from "@/server/adminAuth";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;

  const storeId = request.headers.get("x-tenant-id") ?? "store_urban";
  try {
    const products = await catalogRepository.listProducts(storeId);
    return NextResponse.json({ data: products });
  } catch {
    return NextResponse.json({ error: "The catalogue database is unavailable. Please retry." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;

  const storeId = request.headers.get("x-tenant-id") ?? "store_urban";
  try {
    const payload = productCreateSchema.parse(await request.json());
    const product = await catalogRepository.createProduct(storeId, payload);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    const invalid = error instanceof ZodError || error instanceof SyntaxError;
    return NextResponse.json({ error: invalid ? "Please check the product details." : "The catalogue could not be saved. Please retry." }, { status: invalid ? 400 : 503 });
  }
}
