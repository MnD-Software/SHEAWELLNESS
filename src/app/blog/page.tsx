import { SheaContentPage } from "@/components/storefront/SheaContentPages";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Wellness Journal", description: "Natural skincare, haircare, aromatherapy, and wellness education from Shea Wellness.", alternates: { canonical: "/blog" } };

export default function BlogPage() {
  return <SheaContentPage kind="blog" />;
}
