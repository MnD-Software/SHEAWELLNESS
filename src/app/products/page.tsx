import { SheaContentPage } from "@/components/storefront/SheaContentPages";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Product Guide", description: "Explore Shea Wellness product collections, ingredients, benefits, routines, and formats.", alternates: { canonical: "/products" } };

export default function ProductsPage() {
  return <SheaContentPage kind="products" />;
}
