import type { Metadata } from "next";
import { SheaPolicyPage } from "@/components/storefront/SheaPolicyPage";
export const metadata: Metadata = { title: "Shopping Policies | Shea Wellness", description: "Shea Wellness shopping, product care, and customer support policies.", alternates: { canonical: "/policies" } };
export default function Page() { return <SheaPolicyPage kind="policies" />; }
