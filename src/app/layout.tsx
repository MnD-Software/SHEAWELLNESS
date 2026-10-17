import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SheaMotion } from "@/components/storefront/SheaMotion";
import { PageOverrideRuntime } from "@/components/storefront/PageOverrideRuntime";
import "@/app/globals.css";
import "@/app/premium.css";
import { StorefrontCartProvider } from "@/components/storefront/StorefrontCart";
import { StorefrontChrome } from "@/components/storefront/StorefrontChrome";
import { getStoreContent } from "@/server/repositories/storeContentRepository";
import { platformSnapshot } from "@/lib/platform-data";
import { BrandIdentityProvider } from "@/components/storefront/BrandIdentity";
import { StorefrontContentProvider } from "@/components/storefront/StorefrontContent";
import "@/app/client-refinements.css";
import "@/app/storefront-polish.css";
import "@/app/story-contact.css";
// Shared cart and search must use the current Neon catalogue on every route.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://sheawellness.vercel.app"),
  title: { default: "Shea Wellness LTD | Pure Nilotica Shea", template: "%s | Shea Wellness" },
  description: "Premium handcrafted shea butter skincare and wellness products made from ethically sourced Nilotica shea.",
  icons: { icon: "/assets/owner-zips-2026/brand-green.webp", apple: "/assets/owner-zips-2026/brand-green.webp" },
  alternates: { canonical: "/" },
  openGraph: { title: "Shea Wellness LTD", description: "Natural skin, face, hair, and spa care rooted in African botanical heritage.", type: "website", url: "/" },
  twitter: { card: "summary", title: "Shea Wellness LTD", description: "Natural care rooted in African botanical heritage." }
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const content = await getStoreContent();
  return (
    <html lang="en" data-cms-pending={Object.keys(content.pageOverrides).some(key => key === "__global" || key.startsWith("/")) ? "true" : undefined} suppressHydrationWarning>
      <body>
        <noscript><style>{'html[data-cms-pending="true"] main { visibility: visible; }'}</style></noscript>
        <StorefrontContentProvider initialContent={content}>
        <BrandIdentityProvider branding={content.pageOverrides.__brand?.branding}>
        <StorefrontCartProvider products={content.products}>
        <StorefrontChrome store={platformSnapshot.activeStore} products={content.products} />
        <SheaMotion />
        <PageOverrideRuntime />
        {children}
        </StorefrontCartProvider>
        </BrandIdentityProvider>
        </StorefrontContentProvider>
      </body>
    </html>
  );
}
