import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Natural Skin Care", description: "Shea butter and botanical skin care for dry, sensitive, and glow-seeking skin.", alternates: { canonical: "/skin" } };
export default function SkinPage() { return <SheaDepartmentPage kind="skin" />; }
