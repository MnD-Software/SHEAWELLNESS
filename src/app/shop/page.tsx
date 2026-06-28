import { CommerceStorefront } from "@/components/storefront/CommerceStorefront";
import { platformSnapshot } from "@/lib/platform-data";

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
