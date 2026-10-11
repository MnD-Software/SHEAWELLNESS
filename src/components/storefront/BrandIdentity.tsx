"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { sheaBrand } from "@/lib/shea-content";
import type { BrandIdentity } from "@/lib/page-editor";
export const defaultBrandIdentity: BrandIdentity = {
  name: "Shea Wellness", tagline: "Care inspired by nature", email: sheaBrand.email,
  phone: sheaBrand.phone, address: sheaBrand.address, announcement: "100% natural. Ethically sourced Nilotica shea.",
  logoUrl: "/assets/owner-zips-2026/brand-green.webp", footerLogoUrl: "/assets/owner-zips-2026/brand-gold.webp",
  instagramUrl: "https://www.instagram.com/sheawellnesske/"
};
const IdentityContext = createContext<BrandIdentity>(defaultBrandIdentity);
export function BrandIdentityProvider({ branding, children }: { branding?: Partial<BrandIdentity>; children: ReactNode }) {
  const [current, setCurrent] = useState(branding);
  useEffect(() => setCurrent(branding), [branding]);
  useEffect(() => {
    const update = (event: Event) => setCurrent((event as CustomEvent).detail?.pageOverrides?.__brand?.branding);
    window.addEventListener("shea-storefront-content", update);
    return () => window.removeEventListener("shea-storefront-content", update);
  }, []);
  return <IdentityContext.Provider value={{ ...defaultBrandIdentity, ...current }}>{children}</IdentityContext.Provider>;
}
export const useBrandIdentity = () => useContext(IdentityContext);
