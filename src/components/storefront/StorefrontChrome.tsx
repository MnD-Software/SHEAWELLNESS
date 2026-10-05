"use client";
import { usePathname } from "next/navigation";
import { SheaGlobalHeader } from "./SheaGlobalHeader";
import { CommerceStorefront } from "./CommerceStorefront";
import type { Product, Store } from "@/lib/types";
export function StorefrontChrome({ store, products }: { store: Store; products: Product[] }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <><SheaGlobalHeader products={products} /><CommerceStorefront store={store} products={products} cartOnly /></>;
}
