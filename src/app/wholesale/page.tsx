import { SheaContentPage } from "@/components/storefront/SheaContentPages";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Wholesale and Distribution", description: "Wholesale natural wellness products for retailers, spas, hotels, and distributors.", alternates: { canonical: "/wholesale" } };

export default function WholesalePage() {
  return <SheaContentPage kind="wholesale" />;
}
