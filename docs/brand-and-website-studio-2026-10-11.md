# Brand imagery and website studio — 11 October 2026

The storefront now uses the owner's original green logo in the header and mobile navigation and the gold logo in the footer. The admin sidebar uses the same supplied identity. Brand marks keep their full proportions. The three supplied variants are available in the media library.

Missing product photos are filled from positively identified owner files. Castor and neem use stills from the owner's supplied product films. Tea tree butter and avocado oil use the supplied shea-application and facial-oil ritual photographs where a standalone packshot was not provided; their alternative text describes the scene. Story, editorial, newsletter and guide imagery use supplied photographs or brand artwork. Retired synthetic and unrelated preset images remain detached.

The database migration fills only blank matched product images and adds any missing logo-library entries. It preserves prices, size pricing, inventory, publication status, existing selected images, videos and page content. Its version marker prevents future reads from refilling images intentionally removed by the owner.

## Editing

- **Admin → Site pages:** search the page cards and open **Edit page**. Select an element in the preview or inspector. Copy, images, links, videos and sections have separate tabs. Image controls include the library/upload picker, description, fitting and focal point. Link controls edit the label and destination. Sections support visibility, vertical padding, text alignment and colours. Typography supports text size, alignment and colour.
- **Desktop / Tablet / Mobile:** change the preview width without losing the draft. **Undo** restores the previous edit. Drafts remain available after failed saves, and leaving an unsaved page requires confirmation. **Save page changes** publishes only after a successful server response.
- **Edit shared branding:** edit header, navigation and footer content across storefront routes.
- **Admin → Settings:** edit the brand name, tagline, announcement bar, header/footer logos, email, phone/WhatsApp, address and Instagram link. An empty announcement hides that bar. The contact page and footer links read the saved identity.
- **Products / Media library:** continue to manage catalogue data, prices, stock, size options, product galleries, and campaign slides in their dedicated editors. Those live values are excluded from generic copy/image overrides.

The refreshed admin uses botanical green, warm paper, quiet brass accents, serif headings, clearer cards and a dedicated inspector. Phone layouts stack the preview and controls while retaining access to both.

## Implementation

`src/lib/page-editor.ts` shares element discovery, URL restrictions and override application between the editor and storefront. Existing main-content indices remain compatible with saved text/image overrides. The server validates new destinations and appearance values before persistence. Shared identity is provided from server-loaded content so every storefront route receives the saved values.

Reusable media picking and uploads are separated into `MediaLibraryPicker.tsx` and `admin-media.ts`, avoiding a circular dependency between the dashboard and editor. Presentation overrides live in `src/app/premium.css`.

Verification artifacts are written under the ignored `artifacts/studio`, `artifacts/smoke` and `artifacts/media-picker` folders. Hosted code deployment and physical-phone review are separate from local production-build browser checks.

The editor suite passed at 320, 390, 768 and 1440px: storefront image loading and overflow, page cards, click-to-edit preview, undo, image-library selection, link fields and section visibility. Isolated browser fixtures passed save failure/retry, retained drafts, shared-brand overrides on another route and brand-settings submission. A real Neon round-trip preserved text, images, links, videos, appearance and branding, retained catalogue/media data, rejected an unsafe destination and confirmed removal of the unique QA entry. The saved catalogue has 18 published products and zero published products without an assigned image.

Final validation: the optimized production build and type validation passed. The existing smoke suite passed 288 route/viewport checks, catalogue checks, checkout validation and direct admin access. Media-picker checks passed at 320, 390, 768 and 1832px with 123 thumbnails, three full-image previews and draft selection. The editor suite passed again against the final production build, including a delayed catalogue-content response: the inspector waited for the saved brochure to render before listing its elements. Real database appearance persistence also accepted the image focal-point value `center` and cleaned up its temporary entry.

The completed local production preview runs at `http://localhost:3144`, with editing at `/admin`. The source release is intended for `origin/master` in `MnD-Software/SHEAWELLNESS`; hosted deployment must be verified separately. The one-time owner-image assignments are persisted in the existing content database. Physical-phone review remains separate from browser viewport checks.

## Follow-up: saved logos and product editing

Footer and header logo edits in the shared visual editor now persist to the same stable brand-identity keys used by Settings. Historic indexed logo overrides cannot replace a newer Settings selection. Storefront branding and page overrides refresh on route changes, content-save notifications, focus and other-tab storage notifications. Preview drafts remain isolated from those public refreshes. Successful content saves invalidate the shared Next.js layout.

Orders use vertically arranged cards with wrapping order numbers and full-width controls, keeping each order inside its queue column. The product API now defaults to the active Shea Wellness store instead of the retired `store_urban` identifier, so API-created products appear in the dashboard and product reads use the same catalogue.

`npm run test:branding` covers both logo editors, logo precedence, storefront and published-product routes, saved product imagery, other-tab/focus refreshes, Orders and product-editor geometry, and an image save on a unique unpublished product. Its fixture branding stays inside browser interceptions. Its real draft is removed in cleanup without changing customer-facing products or order status.

The final production build passed with the active-store API correction. The branding regression passed all 26 routes, including saved imagery and logo updates on all 18 published products, both logo save interfaces, focus/storage refresh, and five Orders/product-editor viewport checks. The real product image save passed, preserving the existing catalogue, media library and page overrides; its temporary draft was removed. The editor suite also passed again with all four viewports, retry/draft retention, database-loaded content readiness, real persistence and exact QA-entry cleanup.
