import { NextResponse } from "next/server";
import { getStoreContent } from "@/server/repositories/storeContentRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const content = await getStoreContent();
    return NextResponse.json({ data: content });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load storefront content." }, { status: 500 });
  }
}
