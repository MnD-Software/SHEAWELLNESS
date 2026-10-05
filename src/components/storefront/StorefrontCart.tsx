"use client";
import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { Product } from "@/lib/types";
import { productPriceForSize } from "@/lib/format";
import { readStoredArray } from "@/lib/browser-storage";

export type CartLine = { product: Product; size: string; quantity: number };
type CartContext = { products: Product[]; cart: CartLine[]; ready: boolean; setCart: Dispatch<SetStateAction<CartLine[]>>; count: number; add: (product: Product, size: string, quantity?: number) => void; open: () => void };
const Context = createContext<CartContext | null>(null);
export function StorefrontCartProvider({ children, products }: { children: ReactNode; products: Product[] }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function restore() {
      const lines = readStoredArray("sheaWellnessCart").flatMap(value => {
        if (!value || typeof value !== "object") return [];
        const line = value as { productId?: string; size?: string; quantity?: number };
        const product = products.find(item => item.id === line.productId && ["active", "low_stock"].includes(item.status));
        if (!product || !Number.isInteger(line.quantity) || Number(line.quantity) < 1) return [];
        const size = product.sizes.includes(line.size ?? "") ? line.size! : product.sizes[0];
        return [{ product, size, quantity: Math.min(Number(line.quantity), Math.max(1, product.inventoryQty)) }];
      });
      setCart(lines); setReady(true);
    }
    restore();
    const listener = (event: StorageEvent) => { if (event.key === "sheaWellnessCart") restore(); };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [products]);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem("sheaWellnessCart", JSON.stringify(cart.map(line => ({ productId: line.product.id, title: line.product.title, imageUrl: line.product.sizeMedia?.[line.size]?.imageUrl ?? line.product.imageUrl, price: productPriceForSize(line.product, line.size), size: line.size, quantity: line.quantity })))); } catch { /* Cart remains usable when browser storage is restricted. */ }
  }, [cart, ready]);
  function add(product: Product, size: string, quantity = 1) {
    if (!["active", "low_stock"].includes(product.status) || product.inventoryQty < 1) return;
    setCart(lines => {
      const index = lines.findIndex(line => line.product.id === product.id && line.size === size);
      const nextQuantity = Math.min(product.inventoryQty, Math.max(1, quantity) + (index >= 0 ? lines[index].quantity : 0));
      return index < 0 ? [...lines, { product, size, quantity: nextQuantity }] : lines.map((line, i) => i === index ? { product, size, quantity: nextQuantity } : line);
    });
  }
  const open = () => window.dispatchEvent(new Event("shea-cart-open"));
  return <Context.Provider value={{ products, cart, ready, setCart, count: cart.reduce((sum, line) => sum + line.quantity, 0), add, open }}>{children}</Context.Provider>;
}
export function useStorefrontCart() {
  const value = useContext(Context);
  if (!value) throw new Error("Storefront cart provider is missing.");
  return value;
}
