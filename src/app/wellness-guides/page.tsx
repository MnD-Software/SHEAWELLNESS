import { SheaWellnessGuides } from "@/components/storefront/SheaWellnessGuides";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Skin Hair and Spa Wellness Guides", description: "Step-by-step Shea Wellness routines, benefits, directions, safety notes, and product guidance.", alternates: { canonical: "/wellness-guides" } };

export default function WellnessGuidesPage() {
  return <SheaWellnessGuides />;
}
