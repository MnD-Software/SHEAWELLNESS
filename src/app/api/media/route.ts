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

    const bytes = Buffer.from(image.dataBase64, "base64");
    const headers = {
        "content-type": image.contentType,
        "content-disposition": `inline; filename="${image.filename}"`,
        "cache-control": "public, max-age=31536000, immutable",
        "accept-ranges": "bytes"
    };
    const range = request.headers.get('range');
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return new NextResponse(null, {status: 416, headers: {...headers, 'content-range': `bytes */${bytes.length}`}});
      const start = match[1] ? Number(match[1]) : Math.max(0, bytes.length - Number(match[2]));
      const requestedEnd = match[1] && match[2] ? Number(match[2]) : bytes.length - 1;
      const end = Math.min(requestedEnd, bytes.length - 1, start + 2 * 1024 * 1024 - 1);
      if (!Number.isSafeInteger(start) || start >= bytes.length || end < start) return new NextResponse(null, {status: 416, headers: {...headers, 'content-range': `bytes */${bytes.length}`}});
      return new NextResponse(bytes.subarray(start, end + 1), {status: 206, headers: {...headers, 'content-range': `bytes ${start}-${end}/${bytes.length}`, 'content-length': String(end - start + 1)}});
    }
    if (bytes.length > 3 * 1024 * 1024) {
      let offset = 0;
      const stream = new ReadableStream({pull(controller) { if (offset >= bytes.length) {controller.close();return;} controller.enqueue(bytes.subarray(offset, offset + 65536)); offset += 65536; }});
      return new NextResponse(stream, {headers});
    }
    return new NextResponse(bytes, {headers: {...headers, 'content-length': String(bytes.length)}});
  } catch {
    return NextResponse.json({ error: "Unable to load media." }, { status: 500 });
  }
}
