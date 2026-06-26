import { platformSnapshot } from "@/lib/platform-data";
import type { Store } from "@/lib/types";

export function resolveTenantFromHost(host: string | null): Store {
  const normalizedHost = (host ?? "").split(":")[0].toLowerCase();

  return (
    platformSnapshot.stores.find((store) => {
      return (
        store.platformDomain.toLowerCase() === normalizedHost ||
        store.customDomain?.toLowerCase() === normalizedHost ||
        `${store.slug}.myplatform.local` === normalizedHost
      );
    }) ?? platformSnapshot.activeStore
  );
}
