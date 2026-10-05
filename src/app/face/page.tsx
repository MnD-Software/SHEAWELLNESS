import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Natural Face Care", description: "Gentle face cleansers, botanical facial oils, shea moisture, and practical routines from Shea Wellness.", alternates: { canonical: "/face" } };
export const dynamic = "force-dynamic";
import { getStoreContent } from "@/server/repositories/storeContentRepository";
export default async function FacePage() { const content = await getStoreContent(); return <SheaDepartmentPage kind="face" initialProducts={content.products} />; }
