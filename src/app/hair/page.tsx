import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Natural Hair and Scalp Care", description: "Wash-day and scalp-care products for natural, relaxed, braided, loc'd, and protective styles.", alternates: { canonical: "/hair" } };
export default function HairPage() { return <SheaDepartmentPage kind="hair" />; }
