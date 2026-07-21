import { SheaContentPage } from "@/components/storefront/SheaContentPages";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Our Story", description: "Discover the Shea Wellness story, African botanical heritage, Kenyan manufacturing, sustainability, and community purpose.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return <SheaContentPage kind="about" />;
}
