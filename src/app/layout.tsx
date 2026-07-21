import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SheaMotion } from "@/components/storefront/SheaMotion";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sheawellness.vercel.app"),
  title: { default: "Shea Wellness LTD | Pure Nilotica Shea", template: "%s | Shea Wellness" },
  description: "Premium handcrafted shea butter skincare and wellness products made from ethically sourced Nilotica shea.",
  alternates: { canonical: "/" },
  openGraph: { title: "Shea Wellness LTD", description: "Natural skin, face, hair, and spa care rooted in African botanical heritage.", type: "website", url: "/", images: [{ url: "/assets/shea-hero.png", alt: "Shea Wellness natural care collection" }] },
  twitter: { card: "summary_large_image", title: "Shea Wellness LTD", description: "Natural care rooted in African botanical heritage.", images: ["/assets/shea-hero.png"] }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SheaMotion />
        {children}
      </body>
    </html>
  );
}
