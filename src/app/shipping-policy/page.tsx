import type { Metadata } from "next";
import { SheaPolicyPage } from "@/components/storefront/SheaPolicyPage";
export const metadata: Metadata = { title: "Shipping Information | Shea Wellness", description: "Kenya, international, and wholesale delivery information from Shea Wellness.", alternates: { canonical: "/shipping-policy" } };
export default function Page() { return <SheaPolicyPage kind="shipping" />; }
