import { NextResponse, type NextRequest } from "next/server";
import { getUploadedImage } from "@/server/repositories/mediaUploadRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !UPLOAD_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: "A valid media id is required." }, { status: 400 });
  }

  try {
    const image = await getUploadedImage(id);
    if (!image) return NextResponse.json({ error: "Media not found." }, { status: 404 });

    return new NextResponse(Buffer.from(image.dataBase64, "base64"), {
      headers: {
        "content-type": image.contentType,
        "content-disposition": `inline; filename="${image.filename}"`,
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Unable to load media." }, { status: 500 });
  }
}
