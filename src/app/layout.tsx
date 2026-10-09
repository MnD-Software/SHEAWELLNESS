import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SheaMotion } from "@/components/storefront/SheaMotion";
import { PageOverrideRuntime } from "@/components/storefront/PageOverrideRuntime";
import "@/app/globals.css";
import { StorefrontCartProvider } from "@/components/storefront/StorefrontCart";
import { StorefrontChrome } from "@/components/storefront/StorefrontChrome";
import { getStoreContent } from "@/server/repositories/storeContentRepository";
import { platformSnapshot } from "@/lib/platform-data";
// Shared cart and search must use the current Neon catalogue on every route.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://sheawellness.vercel.app"),
  title: { default: "Shea Wellness LTD | Pure Nilotica Shea", template: "%s | Shea Wellness" },
  description: "Premium handcrafted shea butter skincare and wellness products made from ethically sourced Nilotica shea.",
  alternates: { canonical: "/" },
  openGraph: { title: "Shea Wellness LTD", description: "Natural skin, face, hair, and spa care rooted in African botanical heritage.", type: "website", url: "/" },
  twitter: { card: "summary", title: "Shea Wellness LTD", description: "Natural care rooted in African botanical heritage." }
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const content = await getStoreContent();
  return (
    <html lang="en">
      <body>
        <StorefrontCartProvider products={content.products}>
        <StorefrontChrome store={platformSnapshot.activeStore} products={content.products} />
        <SheaMotion />
        <PageOverrideRuntime />
        {children}
        </StorefrontCartProvider>
      </body>
    </html>
  );
}
