import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getStoreContent, saveMedia, savePageOverrides, saveProducts } from "@/server/repositories/storeContentRepository";
import { requireAdminAccess } from "@/server/adminAuth";
import { safeDestination } from "@/lib/page-editor";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const destination = (media = false) => z.string().max(4000).refine(value => safeDestination(value, media) !== null, "Use a site path or a valid web address.");
const appearanceSchema = z.object({
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(), background: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  align: z.enum(["left", "center", "right"]).optional(), hidden: z.boolean().optional(),
  fontSize: z.string().refine(value => value === "" || (Number(value) >= 10 && Number(value) <= 120)).optional(),
  spacing: z.string().refine(value => value === "" || (Number(value) >= 0 && Number(value) <= 160)).optional(),
  alt: z.string().max(2000).optional(), fit: z.enum(["contain", "cover"]).optional(), position: z.string().regex(/^(?:\d{1,3}% \d{1,3}%|center|top|bottom|left|right)$/).optional()
});
const pageSchema = z.object({
  branding: z.object({
    name: z.string().min(1).max(120).optional(), tagline: z.string().max(160).optional(),
    email: z.string().email().max(254).optional(), phone: z.string().min(5).max(40).optional(),
    address: z.string().max(500).optional(), announcement: z.string().max(200).optional(),
    logoUrl: destination(true).optional(), footerLogoUrl: destination(true).optional(), instagramUrl: destination().optional()
  }).optional(),
  texts: z.record(z.string().max(30000)).optional(), images: z.record(destination(true)).optional(),
  links: z.record(z.object({ href: destination(), label: z.string().max(2000).optional() })).optional(),
  videos: z.record(z.object({ src: destination(true), poster: destination(true).optional() })).optional(),
  appearance: z.record(appearanceSchema).optional()
});
const updateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("products"), products: z.array(z.record(z.unknown())) }),
  z.object({ type: z.literal("media"), media: z.record(z.unknown()) }),
  z.object({ type: z.literal("pageOverrides"), pageOverrides: z.record(pageSchema) })
]);

export async function GET(request: NextRequest) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;

  try {
    return NextResponse.json({ data: await getStoreContent({ strict: true }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load content." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const denied = requireAdminAccess(request);
  if (denied) return denied;

  try {
    const payload = updateSchema.parse(await request.json());
    const content = payload.type === "products"
      ? await saveProducts(payload.products as never)
      : payload.type === "media"
        ? await saveMedia(payload.media as never)
        : await savePageOverrides(payload.pageOverrides as never);
    revalidatePath("/", "layout");
    return NextResponse.json({ data: content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save content.";
    return NextResponse.json({ error: message }, { status: message.includes("DATABASE_URL") ? 503 : 400 });
  }
}
