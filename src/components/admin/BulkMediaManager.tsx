"use client";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { MediaPlacement, SheaMediaAsset, SheaMediaConfig } from '@/lib/shea-content';
import { sanitizeSheaMediaConfig } from '@/lib/shea-content';
import { unpackMedia, uploadMedia } from '@/lib/bulk-media';

type Save = (media: SheaMediaConfig) => Promise<{success: true; data?: {media?: SheaMediaConfig}} | {success: false; message: string}>;
type QueueItem = {id: string; file: File; status: 'waiting' | 'uploading' | 'uploaded' | 'error'; progress: number; error?: string};
type Destination = MediaPlacement | 'library' | 'hero';
const destinations: [Destination, string][] = [['library','Media library only'],['hero','Homepage carousel'],['beforeAfter','Before & after'],['partners','Partner logos'],['films','Product films'],['downloads','Brochure downloads']];

export function BulkMediaManager({media, save, onBusyChange}: {media: SheaMediaConfig; save: Save; onBusyChange: (busy: boolean) => void}) {
  const latest = useRef(media); latest.current = media;
  const pending = useRef<{asset: SheaMediaAsset; destination: Destination}[]>([]);
  const stop = useRef(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Select files or a ZIP, then choose where to display them.');
  const [failed, setFailed] = useState(false);
  const [destination, setDestination] = useState<Destination>('library');
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  useEffect(() => {onBusyChange(busy); return () => onBusyChange(false);}, [busy, onBusyChange]);
  const assets = useMemo(() => [...media.images, ...media.videos, ...(media.documents ?? [])], [media]);
  const filtered = assets.filter(item => `${item.title} ${item.tag}`.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const visible = filtered.slice(Math.min(page, pages - 1) * 24, (Math.min(page, pages - 1) + 1) * 24);
  function update(id: string, values: Partial<QueueItem>) {setQueue(items => items.map(item => item.id === id ? {...item, ...values} : item));}
  async function persist(config: SheaMediaConfig) {
    const result = await save(sanitizeSheaMediaConfig(config));
    setFailed(!result.success);
    if (!result.success) {setMessage(result.message);return false;}
    return true;
  }
  async function publishUploaded() {
    const next = {...latest.current, images: [...latest.current.images], videos: [...latest.current.videos], documents: [...(latest.current.documents ?? [])], heroSlides: [...latest.current.heroSlides]};
    for (const {asset, destination: target} of pending.current) {
      const key = asset.type === 'video' ? 'videos' : asset.type === 'document' ? 'documents' : 'images';
      if (!next[key].some(item => item.id === asset.id)) next[key].push(asset);
      if (target === 'hero' && asset.type === 'image' && !next.heroSlides.some(item => item.id === `slide_${asset.id}`)) next.heroSlides.push({...asset, id: `slide_${asset.id}`, kicker: 'Shea Wellness', body: '', ctaLabel: 'Shop the collection', ctaHref: '/shop', fit: 'cover'});
    }
    if (!pending.current.length) return true;
    if (!await persist(next)) {setMessage('Files uploaded, but library changes were not saved. Use Save uploaded files to retry without uploading again.');return false;}
    pending.current = [];return true;
  }
  async function run(items: QueueItem[]) {
    setBusy(true);setFailed(false);stop.current = false;
    let failures = 0;
    for (const item of items) {
      if (stop.current) break;
      update(item.id, {status: 'uploading', progress: 0, error: undefined});
      try {
        const uploaded = await uploadMedia(item.file, progress => update(item.id, {progress}));
        const type = item.file.type.startsWith('video/') ? 'video' : item.file.type === 'application/pdf' ? 'document' : 'image';
        const validTarget = (type === 'image' && ['beforeAfter', 'partners'].includes(destination)) || (type === 'video' && destination === 'films') || (type === 'document' && destination === 'downloads');
        const asset: SheaMediaAsset = {id: `upload_${uploaded.publicId || item.id}`, title: item.file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), src: uploaded.url, type, tag: 'Uploaded media', placements: validTarget ? [destination as MediaPlacement] : [], fit: 'contain', rotation: 0};
        pending.current.push({asset, destination});update(item.id, {status: 'uploaded', progress: 100});
      } catch (error) {failures++;update(item.id, {status: 'error', error: error instanceof Error ? error.message : 'Upload failed.'});}
    }
    const saved = await publishUploaded();
    if (saved) setMessage(failures ? `Uploaded files saved. ${failures} file(s) need retrying.` : stop.current ? 'Upload paused. Completed files are saved; resume the remaining files below.' : 'Uploaded media saved. Select items below to place, reorder or remove them.');
    setBusy(false);
  }
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);event.target.value = '';if (!files.length || busy) return;
    setBusy(true);setFailed(false);setMessage('Preparing files and checking ZIP contents…');
    try {
      const result = await unpackMedia(files);
      if (!result.files.length) throw new Error('No supported media found. Use images, videos or PDF files.');
      const items: QueueItem[] = result.files.map(file => ({id: crypto.randomUUID(), file, status: 'waiting', progress: 0}));
      setQueue(items);setMessage(`${items.length} unique file(s) ready.${result.skipped.length ? ` Skipped ${result.skipped.length} unsupported, oversized or duplicate entries.` : ''}`);
      await run(items);
    } catch (error) {setFailed(true);setMessage(error instanceof Error ? error.message : 'Unable to read files.');setBusy(false);}
  }
  async function applySelection(action: 'place' | 'hide' | 'remove' | 'rotate') {
    if (!selected.length || busy) return;
    if (action === 'remove' && !confirm('Remove selected entries from the media library and these storefront sections? Product images already assigned remain until changed in Products.')) return;
    setBusy(true);
    const ids = new Set(selected);const chosen = assets.filter(item => ids.has(item.id));
    const sources = new Set(chosen.map(item => item.src));
    const transform = (items: SheaMediaAsset[]) => items.flatMap(item => {
      if (!ids.has(item.id)) return [item];
      if (action === 'remove') return [];
      if (action === 'hide') return [{...item, placements: []}];
      if (action === 'rotate') return [{...item, rotation: ((item.rotation ?? 0) + 90) % 360 as SheaMediaAsset['rotation']}];
      const compatible = (item.type === 'image' && ['partners', 'beforeAfter'].includes(destination)) || (item.type === 'video' && destination === 'films') || (item.type === 'document' && destination === 'downloads');
      return [{...item, placements: compatible ? [...new Set([...(item.placements ?? []), destination as MediaPlacement])] : item.placements}];
    });
    let heroSlides = [...latest.current.heroSlides];
    if (action === 'hide' || action === 'remove') heroSlides = heroSlides.filter(item => !sources.has(item.src));
    if (action === 'place' && destination === 'hero') for (const item of chosen.filter(asset => asset.type === 'image')) {
      if (!heroSlides.some(slide => slide.src === item.src)) heroSlides.push({...item, id: `slide_${item.id}`, kicker: 'Shea Wellness', body: '', ctaLabel: 'Shop the collection', ctaHref: '/shop', fit: 'cover'});
    }
    if (await persist({...latest.current, images: transform(latest.current.images), videos: transform(latest.current.videos), documents: transform(latest.current.documents ?? []), heroSlides})) {setMessage('Selected media updated on the storefront.');setSelected([]);}
    setBusy(false);
  }
  async function move(id: string, direction: number) {
    setBusy(true);
    const key = media.images.some(item => item.id === id) ? 'images' : media.videos.some(item => item.id === id) ? 'videos' : 'documents';
    const items = [...(latest.current[key] ?? [])];const index = items.findIndex(item => item.id === id);const target = index + direction;
    if (index >= 0 && target >= 0 && target < items.length) {const [item] = items.splice(index, 1);items.splice(target, 0, item);await persist({...latest.current, [key]: items});}
    setBusy(false);
  }
  return <section className="bulk-media-manager" aria-label="Bulk media manager">
    <header><div><span>Media library</span><h2>Upload, organise and publish.</h2><p>Add multiple files or a ZIP. Images are optimised automatically; existing product assignments stay intact.</p></div><a href="/" target="_blank" rel="noreferrer">Preview storefront ↗</a></header>
    <div className="bulk-upload-bar"><label>Display location<select aria-label="Media display location" value={destination} disabled={busy} onChange={event => setDestination(event.target.value as Destination)}>{destinations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="bulk-file-label">{busy ? 'Uploading…' : 'Add files or ZIP'}<input aria-label="Bulk files or ZIP" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,application/pdf,.zip" disabled={busy || pending.current.length > 0} onChange={choose} /></label>
      <small>Up to 100 files per batch · ZIP up to 100 MB · images 10 MB · videos 25 MB · PDFs 20 MB</small></div>
    <p role={failed ? 'alert' : 'status'} className={failed ? 'bulk-message error' : 'bulk-message'}>{message}</p>
    {queue.length > 0 && <div className="bulk-queue"><ol>{queue.map(item => <li key={item.id}><span>{item.file.name}</span><progress max={100} value={item.progress} aria-label={`${item.file.name} upload progress`} /><small>{item.error || item.status}</small></li>)}</ol>
      {busy ? <button type="button" onClick={() => {stop.current = true;}}>Stop after current file</button> : <><button type="button" disabled={!queue.some(item => item.status === 'error' || item.status === 'waiting')} onClick={() => void run(queue.filter(item => item.status === 'error' || item.status === 'waiting'))}>Retry / resume uploads</button>{pending.current.length > 0 && <button type="button" onClick={async () => {setBusy(true);if(await publishUploaded()) setMessage('Uploaded files saved to the library.');setBusy(false);}}>Save uploaded files</button>}</>}
    </div>}
    <div className="bulk-library-toolbar"><input aria-label="Search media library" placeholder="Search media…" value={query} onChange={event => {setQuery(event.target.value);setPage(0);}} /><span>{selected.length} selected · {assets.length} files</span><button type="button" disabled={busy} onClick={() => setSelected(visible.map(item => item.id))}>Select this page</button><button type="button" disabled={busy} onClick={() => setSelected([])}>Clear selection</button></div>
    <div className="bulk-selection-actions"><button type="button" disabled={busy || !selected.length || destination === 'library'} onClick={() => void applySelection('place')}>Add to chosen location</button><button type="button" disabled={busy || !selected.length} onClick={() => void applySelection('hide')}>Remove from sections</button><button type="button" disabled={busy || !selected.length} onClick={() => void applySelection('rotate')}>Rotate 90°</button><button type="button" disabled={busy || !selected.length} onClick={() => void applySelection('remove')}>Remove from library</button></div>
    <div className="bulk-library-grid">{visible.map(item => <article key={item.id} className={selected.includes(item.id) ? 'selected' : ''}><label><input type="checkbox" aria-label={`Select ${item.title}`} checked={selected.includes(item.id)} disabled={busy} onChange={event => setSelected(ids => event.target.checked ? [...ids, item.id] : ids.filter(id => id !== item.id))} />{item.type === 'image' ? <img src={item.src} alt={item.alt || item.title} loading="lazy" style={{transform: `rotate(${item.rotation ?? 0}deg)`}} /> : item.type === 'video' ? <video src={item.src} preload="none" poster={item.poster} muted playsInline /> : <span className="bulk-document">PDF</span>}<strong>{item.title}</strong></label><small>{item.placements?.join(', ') || 'Library only'}</small><div><a href={item.src} target="_blank" rel="noreferrer">Preview</a><button type="button" disabled={busy} aria-label={`Move ${item.title} earlier`} onClick={() => void move(item.id, -1)}>↑</button><button type="button" disabled={busy} aria-label={`Move ${item.title} later`} onClick={() => void move(item.id, 1)}>↓</button></div></article>)}</div>
    {!filtered.length && <p>No media matches this search.</p>}
    <div className="shea-admin-pagination"><button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Previous media page</button><span>Page {Math.min(page + 1, pages)} of {pages}</span><button type="button" disabled={page >= pages - 1} onClick={() => setPage(value => value + 1)}>Next media page</button></div>
  </section>;
}
