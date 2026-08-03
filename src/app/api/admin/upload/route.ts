import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export async function POST(request: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary upload credentials are not configured." }, { status: 503 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF, or AVIF image." }, { status: 415 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "shea-wellness";
    const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
    const upload = new FormData();
    upload.set("file", file);
    upload.set("api_key", apiKey);
    upload.set("timestamp", String(timestamp));
    upload.set("folder", folder);
    upload.set("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: upload });
    const result = await response.json() as { secure_url?: string; public_id?: string; width?: number; height?: number; error?: { message?: string } };
    if (!response.ok || !result.secure_url) throw new Error(result.error?.message ?? "Cloudinary rejected the upload.");

    return NextResponse.json({ data: { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload image." }, { status: 500 });
  }
}
