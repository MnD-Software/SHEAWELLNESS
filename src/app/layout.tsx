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
  icons: {
    icon: [{ url: "/assets/website-edits/shea-wellness-logo.jpg", type: "image/jpeg" }],
    shortcut: "/assets/website-edits/shea-wellness-logo.jpg",
    apple: "/assets/website-edits/shea-wellness-logo.jpg"
  },
  alternates: { canonical: "/" },
  openGraph: { title: "Shea Wellness LTD", description: "Natural skin, face, hair, and spa care rooted in African botanical heritage.", type: "website", url: "/", images: [{ url: "/assets/website-edits/community-impact.png", alt: "Women celebrating Shea Wellness community impact" }] },
  twitter: { card: "summary_large_image", title: "Shea Wellness LTD", description: "Natural care rooted in African botanical heritage.", images: ["/assets/website-edits/community-impact.png"] }
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
