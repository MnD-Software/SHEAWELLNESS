import { SheaContentPage } from "@/components/storefront/SheaContentPages";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Product Catalogue", description: "Browse Shea Wellness product media, catalogue information, retail proof, and brand assets.", alternates: { canonical: "/catalogue" } };

export default function CataloguePage() {
  return <SheaContentPage kind="catalogue" />;
}
