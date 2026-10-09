export const MEDIA_CHUNK_BYTES = 2 * 1024 * 1024;
export const mediaTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", pdf: "application/pdf" };
export function mediaTypeForName(name: string) { return mediaTypes[name.split('.').pop()?.toLowerCase() ?? ''] || ''; }
export function mediaSizeLimit(type: string) { return (type.startsWith('video/') ? 25 : type === 'application/pdf' ? 20 : 10) * 1024 * 1024; }
export function validMediaSignature(bytes: Uint8Array, type: string) {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (type === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (type === 'image/png') return bytes[0] === 137 && text(1, 4) === 'PNG';
  if (type === 'image/gif') return text(0, 6) === 'GIF87a' || text(0, 6) === 'GIF89a';
  if (type === 'image/webp') return text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP';
  if (type === 'application/pdf') return text(0, 5) === '%PDF-';
  if (type === 'video/webm') return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  if (type === 'image/avif') return text(4, 8) === 'ftyp' && /avif|avis/.test(text(8, 40));
  if (type === 'video/mp4' || type === 'video/quicktime') return ['ftyp', 'moov', 'mdat', 'wide'].includes(text(4, 8));
  return false;
}
