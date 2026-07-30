import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStoreContent, saveMedia, saveProducts } from "@/server/repositories/storeContentRepository";

export const dynamic = "force-dynamic";

const updateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("products"), products: z.array(z.record(z.unknown())) }),
  z.object({ type: z.literal("media"), media: z.record(z.unknown()) })
]);

export async function GET() {
  try {
    return NextResponse.json({ data: await getStoreContent() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load content." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = updateSchema.parse(await request.json());
    const content = payload.type === "products"
      ? await saveProducts(payload.products as never)
      : await saveMedia(payload.media as never);
    return NextResponse.json({ data: content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save content.";
    return NextResponse.json({ error: message }, { status: message.includes("DATABASE_URL") ? 503 : 400 });
  }
}
