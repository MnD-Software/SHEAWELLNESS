import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Wellness Gifts", description: "Natural wellness gift collections for personal, corporate, hospitality, and family care.", alternates: { canonical: "/wellness-gifts" } };
export const dynamic = "force-dynamic";
import { getStoreContent } from "@/server/repositories/storeContentRepository";
export default async function WellnessGiftsPage() { const content = await getStoreContent(); return <SheaDepartmentPage kind="gifts" initialProducts={content.products} />; }
