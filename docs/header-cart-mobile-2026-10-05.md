# Header, cart, and mobile follow-up — 5 October 2026

## Changes

- A single root storefront header replaces separate per-page headers. Its CSS module isolates branding, icon sizes, navigation, and cart count from legacy page styles.
- One shared cart provider and drawer serve every public page. Product additions, department quick-add, and account reorders update the same cart. Quantity changes survive navigation without redirecting customers to Shop.
- The shared catalogue is loaded dynamically from Neon rather than captured at build time on informational pages.
- Removed obsolete fixed-header spacing. Mobile campaigns use bounded photography, readable type, compact copy, and accessible controls; product buy controls no longer overlap bottom navigation.
- Disabled off-screen product-video autoplay and preloading. Phone image parallax is disabled, and orientation-corrected photos are excluded from desktop parallax.
- CMS image overrides use schema version 3 because moving the header changes page image indexes. Old index-based image overrides cannot reinsert unrelated historical photos; text and stored data remain intact.

## Verification

- Optimized production build completed with compilation and TypeScript validation.
- Mobile sanity suite passed emulated touch swipe, campaign and department carousel controls, menu, product-to-cart flow, checkout through review, all six authenticated admin panels, and malformed browser-storage recovery.
- Cross-page suite passed 72 checks: twelve public routes at six widths (320–1440px), identical header dimensions per width, cart quantity persistence and editing, in-place drawer opening, zero browser exceptions/overflow, and bounded mobile campaign sizing.
- Full production-build route sweep passed 172 checks across 43 routes at 320, 390, 768, and 1440px, with zero overflow, broken-image, or browser-exception failures. Neon catalogue persistence, checkout payload validation, and authenticated admin API guards also passed.
- Visually reviewed 320/390px homepage, Face collection, Contact, and mobile checkout screenshots. The Face collection bottles are upright.
- Browser suites wait for explicit cart hydration and decoded visible images, not network-idle events from streaming media. Viewport sweeps run with bounded concurrency to avoid exhausting Windows browser resources.

Cross-page and full-route sweep results are recorded in ignored `artifacts/chrome/results.json` and `artifacts/smoke/results.json`.

## Repeat

Run the production server with `DATABASE_URL` and `ADMIN_DASHBOARD_KEY` configured. Set `SMOKE_URL` and `SMOKE_ADMIN_KEY` for the test target; never commit credentials.

- `npm run build`
- `npm run test:chrome` — twelve public routes at 320, 390, 430, 768, 1024, and 1440px; exact shared-header dimensions, cart continuity, quantity edits, no cart redirect, no browser exceptions/overflow, and mobile hero sizing.
- `npm run test:smoke` — every top-level route, published product and collection redirect, plus admin guards and API validation.
- `npm run test:sanity` — touch, menu, cart, checkout review, admin panels and storage recovery.

These are local production-build Chromium emulation results, not physical-device or deployed Vercel acceptance. Checkout remains a pending order request: live payment capture still requires provider credentials and verified callbacks. Production admin access still requires the owner's Vercel environment configuration.
