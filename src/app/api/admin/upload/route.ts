import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { saveUploadedImage } from "@/server/repositories/mediaUploadRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

async function uploadToCloudinary(file: File, cloudName: string, apiKey: string, apiSecret: string) {
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
  const body = await response.text();
  let result: { secure_url?: string; public_id?: string; width?: number; height?: number; error?: { message?: string } } = {};
  try {
    result = body ? JSON.parse(body) as typeof result : {};
  } catch {
    // Fall through to the database upload path when a proxy/CDN error is not JSON.
  }
  if (!response.ok || !result.secure_url) throw new Error(result.error?.message ?? "Cloudinary rejected the upload.");

  return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height, storage: "cloudinary" as const };
}

export async function POST(request: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP, GIF, or AVIF image." }, { status: 415 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });

    if (cloudName && apiKey && apiSecret) {
      try {
        return NextResponse.json({ data: await uploadToCloudinary(file, cloudName, apiKey, apiSecret) }, { status: 201 });
      } catch {
        // Neon-backed storage keeps the editor usable if the optional CDN is unavailable.
      }
    }

    const dataBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const stored = await saveUploadedImage({ filename: file.name, contentType: file.type, dataBase64 });
    return NextResponse.json({ data: { url: stored.url, publicId: stored.id, storage: "database" } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload image.";
    const unavailable = message.includes("DATABASE_URL");
    return NextResponse.json({ error: unavailable ? "Image uploads need a DATABASE_URL or valid Cloudinary credentials." : "Unable to upload image. Please try again." }, { status: unavailable ? 503 : 500 });
  }
}
