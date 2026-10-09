# Owner content and mobile layout corrections - 9 October 2026

The shared navbar now stays fixed at the top on every storefront route. Its reserved space follows its measured height, including breakpoint changes. Search, cart and navigation remain available while scrolling; the admin dashboard retains its own navigation.

The concern cards use a normal responsive grid: three columns on desktop, two on tablets and one on phones. Conflicting horizontal carousel rules no longer create squeezed implicit columns. Uploaded photography is contained without distortion, with accessible text and links below each image. WhatsApp floats clear of the mobile tabs. Footer safe-area space is inside the footer, eliminating the blank page area below it.

## Supplied material

- `shea wellness (marcos).docx`: extracted the actual photographs and all fifteen embedded MP4 files. Screenshot examples and file-icon pictures are reference material, not website artwork. Routine photographs are placed in their relevant cards and guide details. Where the document contains only a hair-card screenshot, an actual frame from the supplied hair product video is used.
- `Our Partners Logos.docx`: twenty-nine individual partner logos, with readable names, shown on the homepage and wholesale page. The composite logo sheet is not duplicated as another partner.
- Both cosmetics flyer PDFs have identical SHA-256 hashes. One seven-page PDF is available to view or download on `/catalogue`.
- The two-page greenback brochure is also available on `/catalogue`.
- The ZIP contains four videos, including an exact duplicate. All three unique films are available alongside the fifteen embedded product videos.
- Images are delivered as WebP at a maximum 1600px dimension. Videos load on request, with locally generated poster frames. All eighteen MP4 files were decoded successfully during preparation.
- The homepage image carousel contains three supplied product photographs with uncropped fitting, arrows, dots and swipe controls.

## Catalogue persistence and unresolved source details

The supplied content was saved atomically to Neon after a local backup. The checked-in import script defaults to a dry run; `node scripts/import-owner-content.mjs --apply` performs an explicit import and refuses concurrent edits using the exact database revision. It must not run automatically on every application start.

Existing stock, unrelated products, orders, settings and page copy were preserved. Supplied prices and size-specific photos were applied to the relevant products, including the Chebe serum price of KSh 1,700. Newly documented products without supplied inventory counts have zero available stock, show an availability enquiry, and cannot be ordered online. The checkout independently rejects unavailable stock.

Gift-set contents, photos and prices are explicitly pending in the supplied document; the gift set remains a draft. The document names both Vitamin E and Vitamin F oil, so that item also remains a draft until the owner confirms its name. No photograph was invented for products that the document marks as having no picture.

Source assets are in `public/assets/owner-oct-2026/`; the manifest is `docs/owner-media-manifest.json`. The private reference Word documents and database backup are not published as downloads.

## Verification

Run `npm run build`, `npm run typecheck`, `npm run test:smoke`, `npm run test:chrome`, `npm run test:sanity`, `npm run test:media`, `npm run test:database`, `npm run test:layout`, and `npm run test:owner-media` with `SMOKE_URL` set to the running production server. Browser tests support `QA_PLAYWRIGHT_MODULE` and `QA_BROWSER_PATH`; layout tests also support `QA_BROWSER_ENGINE=webkit` for Safari-engine coverage.

MP4 playback was verified with installed Microsoft Edge. This machine's bundled test Chromium reports no H.264 codec; use `QA_BROWSER_PATH` pointing to installed Edge or Chrome for `test:owner-media`. The supplied files use browser-compatible H.264 Baseline video and AAC audio, and all eighteen were independently decoded.

Final run evidence is recorded in the corresponding `artifacts/` folders. These local generated files and `.env.local` are excluded from the GitHub release. Physical-phone acceptance is separate from browser emulation.

Validated production build: `PKCqJNunTOLlhTTP3MCoa`, served locally on port 3143.

- Build and TypeScript checks passed.
- 288 route and viewport smoke checks passed, with no broken images, horizontal overflow or browser exceptions.
- 72 shared header/cart checks passed across six screen widths, including the final compact mobile carousel.
- 49 Safari-engine layout checks passed across seven widths, covering fixed navigation after scrolling, header spacing after resizing, all six routine cards, footer spacing, floating WhatsApp placement, and search/menu interactions.
- 14 portrait/landscape media fitting checks passed, plus keyboard controls, reduced motion, and isolated upload/save failure, retry and reload checks.
- 87 supplied resource checks passed, including both PDF downloads, all 29 logos, 18 videos, actual H.264 metadata loading in Edge, size-specific photographs/prices, draft protection and server-side stock rejection.
- Checkout, carousel interactions, mobile navigation, all six dashboard sections, invalid local storage and Neon persistence/order/enquiry sanity checks passed. Temporary database QA records were removed.
