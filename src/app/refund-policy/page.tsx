import type { Metadata } from "next";
import { SheaPolicyPage } from "@/components/storefront/SheaPolicyPage";
export const metadata: Metadata = { title: "Refund Policy | Shea Wellness", description: "Refund, replacement, and order-resolution guidance for Shea Wellness purchases.", alternates: { canonical: "/refund-policy" } };
export default function Page() { return <SheaPolicyPage kind="refund" />; }
