import { CommerceStorefront } from "@/components/storefront/CommerceStorefront";
import { platformSnapshot } from "@/lib/platform-data";

export default function StorefrontPage() {
  return <CommerceStorefront store={platformSnapshot.activeStore} products={platformSnapshot.products} />;
}
