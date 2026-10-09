# Shea Wellness media and storefront refinement

The homepage campaign is a compact beauty banner: an edge-to-edge photograph, short copy, shop action, swipe/navigation controls and a pause button. Routine cards use one phone column, two tablet columns and three desktop columns. The fixed header reserves its measured height.

The shop, department and recommendation cards share a product presentation with fitted photography, visible prices, selectable variations, availability and an add-to-bag action. A selected variation determines the image and exact price; cart and checkout use the same server-authoritative variation price. Product galleries support additional angles, and product films open on demand.

## Manage media

Open **Admin ? Media library**. Choose a display location, then **Add files or ZIP**. ZIPs are unpacked in the browser; supported images, videos and PDFs upload with progress. Exact duplicates within a batch are skipped. Images are resized to a maximum 2,000 pixels when this reduces file size. Large media uploads in parts, and videos support byte-range playback.

Select library items to add them to a homepage carousel, before-and-after rail, partner rail, films or brochure downloads. **Remove from sections** hides selected media from those sections. **Remove from library** removes library entries and their section placements; existing product assignments remain until edited in Products. Use the arrows to reorder entries and rotation controls to correct orientation. Individual slide/image editing provides titles, alternative text, crop position and fill/fit controls.

In **Products**, use **Choose from media library**, **Choose variation image**, and **Add image to gallery**. Remove gallery images with their thumbnail buttons. Select the correct size photo rather than assigning an unverified jar size.

The image chooser scrolls through thumbnails at their full card height. Every image fits inside its thumbnail without cropping; captions remain visible. **Preview full image** opens a large, fitted view with **Use this image** and **Open original** actions. Escape closes the preview before closing the chooser.

If a file upload fails, use **Retry / resume uploads**. If uploads succeed but saving fails, use **Save uploaded files**; this preserves the already-uploaded URLs and retries only the library save.

Limits: 100 files / 200 MB extracted per batch; ZIP 100 MB; images 10 MB; videos 25 MB; PDFs 20 MB. JPG, PNG, WebP, GIF, AVIF, MP4, WebM, MOV and PDF are supported. Exports and originals remain available through Preview.

## Supplied ZIP imports

All four supplied archives were reviewed. The import adds 52 images and four additional unique videos; videos already present were skipped. Product labels match the butter photos to their products, with alternate views in galleries. Comparisons and partner logos retain their full images. Two repeated comparison photographs stay in the library while their originals appear once in the running rail.

Stock and publication states are preserved. Supplied size prices remain authoritative. Existing prices without a new source remain unchanged. The gift set and ambiguous vitamin-oil item remain drafts pending owner confirmation. New photograph labels do not establish jar size; existing verified size media is retained.

`scripts/import-owner-zips.mjs` defaults to a dry run. `--apply` requires the existing store, records a backup and checks the content revision before updating. It is a historical import, not a deploy hook; rerunning it replaces the imported campaign selection. The asset/source mapping is in `docs/owner-zips-manifest.json`.

## Verification

Use `npm run build`, `npm run typecheck`, and the `test:smoke`, `test:sanity`, `test:chrome`, `test:layout`, `test:media`, `test:owner-media`, `test:refinements`, `test:database`, and `test:chunks` scripts. Set `SMOKE_URL` to the running production build. `QA_BROWSER_PATH` chooses an installed H.264-capable Chrome/Edge browser; `QA_BROWSER_ENGINE=webkit` selects Safari layout coverage. QA browser screenshots and results are written under ignored `artifacts/`.

The refinement test isolates bulk library writes with browser fixtures, tests ZIP duplicate filtering, upload/save recovery, reload, placements/removal, carousel controls, responsive cards and variation/cart prices. Database tests create temporary records and remove them in finally blocks. Chunk tests upload a real 7.8 MB PDF and 4.2 MB MP4, retrieve the exact PDF, validate video metadata, ranges, missing-part rejection and retry behavior, then remove only their own records.

`test:media-picker` checks every image across every chooser page at 320, 390, 768 and 1832 pixels, verifies complete thumbnails and captions, exercises portrait, landscape and logo previews, and selects an image without saving a product change. Run it with Chromium/Edge and WebKit. Uploaded video/PDF responses bypass CDN caching so byte-range requests reach the media endpoint; static storefront assets retain their normal CDN behavior.
