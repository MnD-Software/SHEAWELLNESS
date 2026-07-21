import { SheaDepartmentPage } from "@/components/storefront/SheaDepartmentPage";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Wellness Gifts", description: "Natural wellness gift collections for personal, corporate, hospitality, and family care.", alternates: { canonical: "/wellness-gifts" } };
export default function WellnessGiftsPage() { return <SheaDepartmentPage kind="gifts" />; }
