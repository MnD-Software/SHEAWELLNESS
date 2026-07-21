import { SheaContentPage } from "@/components/storefront/SheaContentPages";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sustainability", description: "Learn about Shea Wellness responsible sourcing, ethical supply chains, conscious production, and community value.", alternates: { canonical: "/sustainability" } };

export default function SustainabilityPage() {
  return <SheaContentPage kind="sustainability" />;
}
