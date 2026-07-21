import { SheaAccountDashboard } from "@/components/storefront/SheaAccountDashboard";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Customer Account", description: "Review Shea Wellness orders, saved activity, and product reviews.", alternates: { canonical: "/account" }, robots: { index: false, follow: false } };

export default function AccountPage() {
  return <SheaAccountDashboard />;
}
