import { SheaContentPage } from "@/components/storefront/SheaContentPages";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Quality Standards", description: "Shea Wellness formulation, packaging, manufacturing, safety, and export-quality commitments.", alternates: { canonical: "/quality" } };

export default function QualityPage() {
  return <SheaContentPage kind="quality" />;
}
