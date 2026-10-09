# Dashboard, owner-managed images and responsive carousel — 9 October 2026

The dashboard opens directly at `/admin`, without an access-code screen or a required admin key. The shared server policy permits the dashboard APIs to load and save without credentials, as requested by the owner.

All existing image assignments have been cleared from the saved catalogue, product-size options, campaign slides, page overrides and media library. A single atomic Neon migration records `owner_image_reset_version = 1`; subsequent reads and server restarts retain new uploads. Original files, product descriptions, prices, inventory, publishing status and videos remain available. Repository preset images, including retired synthetic images, cannot return through old defaults or overrides. New uploads, hosted images and newly added asset files remain usable.

The homepage carousel now uses a full-width image stage with `object-fit: contain`, without image rotation, stretching or cropping. Copy sits below uploaded images, with arrows, dots, keyboard navigation, touch swipe and pause controls for multiple slides. It respects reduced motion and pauses while a visitor interacts. An empty image slot uses a quiet cream and forest-green treatment. Saved single-slide and empty-carousel choices are respected.

The moving partner-photo and routine-photo strips have been replaced with static names and routine steps. Header branding uses a text monogram. Social previews no longer contain preset photos. Phone and tablet content is visible immediately during scrolling, without waiting for reveal animations. Empty image slots remain available to the page editor.

## Add your photos

- Open `/admin` → **Media library** → **Homepage carousel**. Edit the saved campaign or select **Add media**, upload a photo, then save. Add a second campaign to enable arrows and dots.
- Use **Products** to upload the main product photo and optional images for individual sizes.
- Use **Site pages** to replace an empty image slot in the page preview. Uploads only publish after a successful save; failed uploads and saves retain the draft for retry.

## Verification

The final optimized production build and TypeScript check passed. All browser suites ran against that build at `http://localhost:3141`.

- **Smoke:** 258 checks across 43 routes at 320, 390, 430, 768, 1024 and 1440px. Every route returned 200, with zero horizontal overflow, broken images or browser exceptions. Admin APIs loaded without credentials; invalid checkout, product and enquiry payloads were rejected. No retired preset images appeared.
- **Shared chrome:** 72 checks across twelve routes and six widths. Header dimensions matched, cart counts and quantity edits survived navigation, and the cart opened in place. Mobile campaign height and heading size stayed within their limits.
- **Sanity:** mobile navigation, saved single-campaign state, collection carousel controls, product-to-cart flow, checkout through review, all six admin panels, and recovery from malformed browser storage passed.
- **Media:** fourteen landscape/portrait fitting checks across seven screen sizes, including landscape orientation. Image containment, natural proportions, keyboard controls, actual touch swipes and reduced motion passed. Isolated upload failure/retry, save failure/retry and saved-media reload also passed. These banner fixtures were browser-only and were never published to the store.
- **Database:** real Neon upload/retrieval, the completed one-time image reset, retention of a newly assigned image, product and settings persistence, canonical order pricing, idempotent retries, conflicting retry rejection, order status persistence and enquiry storage passed. Temporary QA records were removed using their exact generated identifiers.
- **Saved state:** zero product images, zero campaign images and an empty image library after cleanup. The image-reset marker is 1 and the page-image override schema is 4.

Evidence: `artifacts/smoke/results.json`, `artifacts/chrome/results.json`, `artifacts/media/results.json`, and the screenshots in those folders. Phone and desktop homepage, collection and checkout screenshots were visually reviewed.

Repeat with `npm run typecheck`, `npm run build`, `npm run test:smoke`, `npm run test:chrome`, `npm run test:sanity`, `npm run test:media` and `npm run test:database`. Set `SMOKE_URL` to the running production server. On this Windows machine the browser suites used `QA_PLAYWRIGHT_MODULE=file:///C:/SheaQA/node_modules/playwright/index.mjs` and the installed Chromium executable through `QA_BROWSER_PATH`.

## Delivery boundary

Source changes and the local preview are available in this workspace. Hosted deployment and physical-phone acceptance are separate from local Chromium emulation.
