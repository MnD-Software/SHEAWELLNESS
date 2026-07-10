import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SheaMotion } from "@/components/storefront/SheaMotion";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Shea Wellness LTD | Pure Nilotica Shea",
  description: "Premium handcrafted shea butter skincare and wellness products made from ethically sourced Nilotica shea."
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
