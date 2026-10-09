import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/server/adminAuth';
import { beginMediaUpload, cancelMediaUpload, completeMediaUpload, saveMediaChunk } from '@/server/repositories/chunkUploadRepository';
import { MEDIA_CHUNK_BYTES } from '@/lib/media-file-types';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const idSchema = z.string().uuid();
export async function POST(request: NextRequest) {
  const denied = requireAdminAccess(request); if (denied) return denied;
  try {
    const body = await request.json();
    if (body.action === 'complete') return NextResponse.json({data: await completeMediaUpload(idSchema.parse(body.id))});
    const input = z.object({filename: z.string().min(1).max(250), contentType: z.string(), size: z.number().int().positive()}).parse(body);
    return NextResponse.json({data: await beginMediaUpload(input)}, {status: 201});
  } catch (error) { return NextResponse.json({error: error instanceof Error ? error.message : 'Unable to upload media.'}, {status: 400}); }
}
export async function PUT(request: NextRequest) {
  const denied = requireAdminAccess(request); if (denied) return denied;
  try {
    const form = await request.formData(); const file = form.get('file');
    if (!(file instanceof File) || file.size > MEDIA_CHUNK_BYTES) return NextResponse.json({error: 'Upload part is too large.'}, {status: 413});
    await saveMediaChunk(idSchema.parse(form.get('id')), Number(form.get('index')), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({data: {saved: true}});
  } catch (error) { return NextResponse.json({error: error instanceof Error ? error.message : 'Unable to save upload part.'}, {status: 400}); }
}
export async function DELETE(request: NextRequest) {
  const denied = requireAdminAccess(request); if (denied) return denied;
  try { await cancelMediaUpload(idSchema.parse(request.nextUrl.searchParams.get('id'))); return NextResponse.json({data: {cancelled: true}}); }
  catch { return NextResponse.json({error: 'Unable to cancel upload.'}, {status: 400}); }
}
