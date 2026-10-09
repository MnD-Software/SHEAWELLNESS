import { MEDIA_CHUNK_BYTES, mediaSizeLimit, mediaTypeForName, mediaTypes, validMediaSignature } from './media-file-types';

export async function unpackMedia(files: File[]) {
  const accepted: File[] = []; const skipped: string[] = []; let total = 0;
  const add = (file: File) => {
    const type = mediaTypeForName(file.name);
    if (!type || file.name.startsWith('.') || file.size > mediaSizeLimit(type) || !file.size) {skipped.push(file.name);return;}
    total += file.size;
    if (accepted.length >= 100 || total > 200 * 1024 * 1024) throw new Error('Add up to 100 files and 200 MB of extracted media per batch.');
    accepted.push(new File([file], file.name.split(/[\\/]/).pop()!, {type}));
  };
  for (const file of files) {
    if (!/\.zip$/i.test(file.name)) {add(file);continue;}
    if (file.size > 100 * 1024 * 1024) throw new Error('ZIP files must be 100 MB or smaller.');
    const {unzip} = await import('fflate');
    const skippedEntries: string[] = []; let count = accepted.length; let expanded = total;
    const extracted = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
      file.arrayBuffer().then(buffer => {
        try {
          unzip(new Uint8Array(buffer), {filter(entry) {
            const type = mediaTypeForName(entry.name);
            const unsafe = entry.name.split(/[\\/]/).some(part => part === '..' || part.startsWith('.')) || entry.name.startsWith('__MACOSX') || entry.name.startsWith('/');
            if (entry.name.endsWith('/')) return false;
            if (unsafe || !type || !entry.originalSize || entry.originalSize > mediaSizeLimit(type)) {skippedEntries.push(entry.name);return false;}
            count++; expanded += entry.originalSize;
            if (count > 100 || expanded > 200 * 1024 * 1024) throw new Error('ZIP contains too many files or exceeds 200 MB when extracted.');
            return true;
          }}, (error, result) => error ? reject(error) : resolve(result));
        } catch (error) {reject(error);}
      }).catch(reject);
    });
    skipped.push(...skippedEntries);
    for (const [name, bytes] of Object.entries(extracted)) add(new File([new Uint8Array(bytes)], name, {type: mediaTypeForName(name)}));
  }
  // Exact duplicate files are kept only once, including repeated ZIP entries.
  const seen = new Set<string>(); const unique: File[] = [];
  for (const file of accepted) {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()))).map(value => value.toString(16).padStart(2, '0')).join('');
    if (seen.has(hash)) skipped.push(`${file.name} (duplicate)`); else {seen.add(hash);unique.push(file);}
  }
  return {files: unique, skipped};
}

async function optimizedImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;
  const bitmap = await createImageBitmap(file, {imageOrientation: 'from-image'});
  try {
    const ratio = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext('2d'); if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.88));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {type: 'image/webp'}) : file;
  } finally {bitmap.close();}
}
async function responseData(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.data) throw new Error(payload?.error || `Upload failed (${response.status}). Please retry.`);
  return payload.data;
}
async function retryRequest(request: () => Promise<Response>) {
  let error: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await responseData(await request()); } catch (caught) {error = caught; if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));}
  }
  throw error;
}
export async function uploadMedia(file: File, progress?: (percent: number) => void): Promise<{url: string; publicId?: string}> {
  const type = file.type || mediaTypeForName(file.name);
  if (!Object.values(mediaTypes).includes(type) || !file.size || file.size > mediaSizeLimit(type)) throw new Error('Use an image up to 10 MB, video up to 25 MB, or PDF up to 20 MB.');
  if (!validMediaSignature(new Uint8Array(await file.slice(0, 48).arrayBuffer()), type)) throw new Error('The file contents do not match the filename or media type.');
  const prepared = await optimizedImage(file);
  if (prepared.size <= 3 * 1024 * 1024) {
    const form = new FormData(); form.set('file', prepared);
    const data = await retryRequest(() => fetch('/api/admin/upload', {method: 'POST', body: form}));
    progress?.(100); return data;
  }
  const session = await responseData(await fetch('/api/admin/upload/chunks', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({filename: prepared.name, contentType: prepared.type, size: prepared.size})}));
  const count = Math.ceil(prepared.size / MEDIA_CHUNK_BYTES);
  try {
    for (let index = 0; index < count; index++) {
      const form = new FormData(); form.set('id', session.id); form.set('index', String(index)); form.set('file', prepared.slice(index * MEDIA_CHUNK_BYTES, (index + 1) * MEDIA_CHUNK_BYTES), prepared.name);
      await retryRequest(() => fetch('/api/admin/upload/chunks', {method: 'PUT', body: form}));
      progress?.(Math.round((index + 1) / (count + 1) * 100));
    }
    const data = await retryRequest(() => fetch('/api/admin/upload/chunks', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({action: 'complete', id: session.id})}));
    progress?.(100); return data;
  } catch (error) {
    void fetch(`/api/admin/upload/chunks?id=${session.id}`, {method: 'DELETE'}).catch(() => undefined); throw error;
  }
}
