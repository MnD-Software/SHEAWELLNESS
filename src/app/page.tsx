import { CommerceStorefront } from "@/components/storefront/CommerceStorefront";
import { platformSnapshot } from "@/lib/platform-data";
import { getStoreContent } from "@/server/repositories/storeContentRepository";
import { readStorefrontSettings } from "@/server/repositories/settingsRepository";
export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  const content = await getStoreContent();
  const settings = await readStorefrontSettings().catch(() => ({ wellnessGuidesEnabled: false }));
  return <CommerceStorefront store={platformSnapshot.activeStore} products={content.products} featuredProductLimit={4} initialMedia={content.media} initialWellnessGuidesEnabled={settings.wellnessGuidesEnabled} />;
}
