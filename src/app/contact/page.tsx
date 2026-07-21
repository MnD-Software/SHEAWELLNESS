import { SheaContentPage } from "@/components/storefront/SheaContentPages";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Contact", description: "Contact Shea Wellness in Westlands, Nairobi for product, order, retail, and wholesale support.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return <SheaContentPage kind="contact" />;
}
