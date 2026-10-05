# Storefront verification - 5 October 2026

## Verified results

- Final production build: passed compilation and TypeScript validation.
- Release-build browser sweep: 172 checks across 43 routes at 320, 390, 768, and 1440 pixels; zero horizontal-overflow failures, browser exceptions, or broken images.
- Mobile interaction suite: passed actual emulated touch swipe, both carousel controls, menu, add-to-cart, checkout through review, all six admin panels, and corrupt-storage recovery.
- Live Neon integration checks: passed durable upload/retrieval, global settings persistence, product creation/readback, canonical prices, idempotency/conflict behavior, fulfillment changes, and enquiry creation/readback. Temporary QA records were removed.
- Existing Vercel admin endpoint returned 503 before release because its admin access key was not configured. The owner will configure `ADMIN_DASHBOARD_KEY` in Production and redeploy.

These are local production-build and real-database results, not a claim that a physical phone, live payment provider, or the new Vercel deployment has passed acceptance testing.

## Repairs

- Replaced the homepage carousel with an isolated responsive component, touch swipe, keyboard controls, explicit pause, and reduced-motion support.
- Restored collection carousel controls on phones and separated arrows from pagination.
- Corrected modal stacking: mobile navigation no longer blocks Checkout. Mobile WhatsApp links no longer cover carousel controls.
- Fixed reveal animations that left tall mobile sections hidden.
- Protected live carousel content from index-based CMS overrides and stopped product normalization from overwriting newly saved images.
- Fixed the empty-media admin editor crash and labelled icon-only admin navigation.
- Replaced the seed-only product repository with Neon persistence. Homepage, shop, department pages, and product details read the saved catalogue server-side.
- Migrated the old empty catalogue once. A subsequently saved empty catalogue stays empty.
- Added durable contact enquiries and an authenticated enquiries panel.
- Store settings and theme API writes now persist in Neon. The homepage guide toggle applies to all visitors, not only the administrator's browser.
- Added safe recovery from malformed browser-storage JSON and corrected variation prices in the cart.

## Repeatable checks

Install dependencies from `pnpm-lock.yaml`, then install Chromium with `pnpm exec playwright install chromium`.

Run the server with `DATABASE_URL` and `ADMIN_DASHBOARD_KEY` configured. Never commit these values. Set `SMOKE_URL` to the test server URL and `SMOKE_ADMIN_KEY` to its administrator key.

- `pnpm run build`: production compilation and TypeScript checks.
- `pnpm run test:smoke`: all top-level routes, collection redirects, every published product, and widths 320, 390, 768, and 1440. Checks HTTP responses, horizontal overflow, browser exceptions, broken images, campaign controls, admin authentication, and invalid payload handling.
- `pnpm run test:sanity`: actual touch swipe, collection navigation, mobile menu, product-to-cart flow, checkout through review, every admin panel, and corrupt local-storage recovery.
- `pnpm run test:database`: real Neon settings persistence, product create/read, server-authoritative order totals, idempotent checkout, conflicting retry rejection, fulfillment changes, and enquiries. Deletes only exact temporary QA records from the run; preserves real records.

Browser evidence is written to ignored `artifacts/smoke/`. Browser checks use Chromium mobile emulation, not a physical iPhone/Android device.

## Release boundaries

Checkout currently creates a pending order request. It does not collect money, fabricate payment confirmation, or imply delivery charges have been settled. Live M-Pesa/card/PayPal integrations require configured provider credentials and verified callbacks before paid checkout can be accepted.

Vercel must have the correct `DATABASE_URL` and a private `ADMIN_DASHBOARD_KEY`. Local QA uses a temporary key, not a deployment credential. Media uploads use Cloudinary when configured, with durable Neon-backed storage as the fallback; they do not depend on a temporary serverless filesystem.

The unused Prisma package commands were removed: this project uses the Neon serverless driver and idempotent repository schema setup, not Prisma migrations.
