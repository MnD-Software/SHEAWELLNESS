import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Natural Hair and Scalp Care", description: "Wash-day and scalp-care products for natural, relaxed, braided, loc'd, and protective styles.", alternates: { canonical: "/hair" } };
export const dynamic = "force-dynamic";
import { getStoreContent } from "@/server/repositories/storeContentRepository";
export default async function HairPage() { const content = await getStoreContent(); return <SheaDepartmentPage kind="hair" initialProducts={content.products} />; }
