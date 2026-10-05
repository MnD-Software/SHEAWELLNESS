import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Natural Skin Care", description: "Shea butter and botanical skin care for dry, sensitive, and glow-seeking skin.", alternates: { canonical: "/skin" } };
export const dynamic = "force-dynamic";
import { getStoreContent } from "@/server/repositories/storeContentRepository";
export default async function SkinPage() { const content = await getStoreContent(); return <SheaDepartmentPage kind="skin" initialProducts={content.products} />; }
