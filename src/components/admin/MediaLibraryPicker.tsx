"use client";
import { useEffect, useState } from "react";
import { Search, Image } from "lucide-react";
import clsx from "clsx";
import { StorefrontImage } from "@/components/storefront/StorefrontImage";
import type { SheaMediaAsset, SheaHeroSlide } from "@/lib/shea-content";

function mediaFilename(src: string) {
  const filename = src.split("?")[0].split("/").pop() || src;
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

export function MediaLibraryPicker({
  assets,
  selectedSrc,
  onSelect,
  onClose,
  onUploadFile,
  isLoading = false
}: {
  assets: Array<SheaMediaAsset | SheaHeroSlide>;
  selectedSrc: string;
  onSelect: (src: string) => void;
  onClose: () => void;
  onUploadFile?: (file: File) => Promise<string>;
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [page, setPage] = useState(0);
  const [preview, setPreview] = useState<SheaMediaAsset | SheaHeroSlide | null>(null);
  const uniqueAssets = Array.from(new Map(assets.filter((asset) => asset.type === "image" && asset.src).map((asset) => [asset.src, asset])).values());
  const visibleAssets = uniqueAssets.filter((asset) => `${asset.title} ${asset.tag}`.toLowerCase().includes(search.trim().toLowerCase()));
  const pageSize = 24;
  const pageCount = Math.max(1, Math.ceil(visibleAssets.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageAssets = visibleAssets.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => setPage(0), [search]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { if (preview) setPreview(null); else onClose(); }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, preview]);

  return (
    <div className="shea-media-picker-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="shea-media-picker" role="dialog" aria-modal="true" aria-labelledby="media-library-title">
        <header>
          <div><span>Media</span><h2 id="media-library-title">Choose an image</h2></div>
          <button type="button" onClick={onClose} aria-label="Close media library">×</button>
        </header>
        <div className="shea-media-picker-tools">
          <label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search media library" autoFocus /></label>
          {onUploadFile ? <label className="shea-media-picker-upload">{uploading ? "Uploading…" : "Upload from computer"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={uploading} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setUploading(true); setUploadError(""); try { onSelect(await onUploadFile(file)); } catch (error) { setUploadError(error instanceof Error ? error.message : "Unable to upload image."); } finally { setUploading(false); event.target.value = ""; } }} /></label> : null}
          <strong>{visibleAssets.length} images</strong>
        </div>
        {uploadError ? <p className="shea-media-picker-error" role="alert">{uploadError}</p> : null}
        <div className="shea-media-picker-grid">
          {isLoading ? <p className="shea-media-picker-loading">Loading your saved media library…</p> : pageAssets.map((asset) => (
            <article key={asset.src} className={clsx("media-picker-card", asset.src === selectedSrc && "selected")}>
              <button className="media-picker-image" type="button" onClick={() => onSelect(asset.src)} aria-label={`Choose ${asset.title}`} title={asset.title}>
                <StorefrontImage src={asset.src} alt={asset.alt || asset.title} loading="lazy" decoding="async" />
              </button>
              <span>{asset.title}</span>
              <small>{mediaFilename(asset.src)}</small>
              <button className="media-picker-preview-button" type="button" onClick={() => setPreview(asset)} aria-label={`Preview ${asset.title}`}>Preview full image</button>
            </article>
          ))}
        </div>
        {!isLoading && visibleAssets.length > pageSize ? <footer className="shea-media-picker-pagination">
          <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0}>Previous</button>
          <span>Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, visibleAssets.length)} of {visibleAssets.length}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1}>Next</button>
        </footer> : null}
        {!isLoading && !visibleAssets.length ? <div className="shea-admin-empty"><Image size={28} /><strong>No images found</strong><p>Upload an image or try a different search.</p></div> : null}
        {preview && <div className="media-picker-full-preview" role="region" aria-label="Full image preview">
          <header><h3>{preview.title}</h3><button type="button" onClick={() => setPreview(null)} aria-label="Close full image preview" autoFocus>×</button></header>
          <div><StorefrontImage src={preview.src} alt={preview.alt || preview.title} /></div>
          <footer><button type="button" onClick={() => onSelect(preview.src)}>Use this image</button><a href={preview.src} target="_blank" rel="noreferrer">Open original</a></footer>
        </div>}
      </section>
    </div>
  );
}
