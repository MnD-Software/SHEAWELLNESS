import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Spa Essentials and Aromatherapy", description: "Essential oils, diffusers, humidifiers, massage care, and professional spa supplies.", alternates: { canonical: "/spa-essentials" } };
export const dynamic = "force-dynamic";
import { getStoreContent } from "@/server/repositories/storeContentRepository";
export default async function SpaEssentialsPage() { const content = await getStoreContent(); return <SheaDepartmentPage kind="spa" initialProducts={content.products} />; }
