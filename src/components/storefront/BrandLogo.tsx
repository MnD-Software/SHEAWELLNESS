"use client";
import { useBrandIdentity } from "./BrandIdentity";
/** Original owner-supplied marks, displayed without cropping. */
export function BrandLogo({ variant = "green", className = "" }: { variant?: "green" | "gold" | "black"; className?: string }) {
  const brand = useBrandIdentity();
  const src = variant === "green" ? brand.logoUrl : variant === "gold" ? brand.footerLogoUrl : "/assets/owner-zips-2026/brand-black.webp";
  return <img className={`shea-brand-logo ${className}`} src={src || undefined} alt={`${brand.name} — Pure. Ethical. Holistic.`} width={1024} height={1536} data-image-label={variant === "gold" ? "Footer logo" : "Storefront logo"} data-brand-logo={variant === "green" ? "logoUrl" : variant === "gold" ? "footerLogoUrl" : undefined} />;
}
