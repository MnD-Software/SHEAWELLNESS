import { CommerceStorefront } from "@/components/storefront/CommerceStorefront";
import { platformSnapshot } from "@/lib/platform-data";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Shop Natural Wellness Products", description: "Shop Shea Wellness skin, face, hair, aromatherapy, gifts, and spa essentials.", alternates: { canonical: "/shop" } };

type ShopSearchParams = Promise<{ search?: string }>;

export default async function ShopPage({ searchParams }: { searchParams: ShopSearchParams }) {
  const resolvedSearchParams = await searchParams;

  return (
    <CommerceStorefront
      store={platformSnapshot.activeStore}
      products={platformSnapshot.products}
      initialSearch={resolvedSearchParams.search ?? ""}
    />
  );
}
