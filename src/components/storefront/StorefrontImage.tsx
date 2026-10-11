import type { ImgHTMLAttributes } from "react";
import { clearPresetImage } from "@/lib/shea-media";

/** Supplied ritual photographs are described as scenes rather than packshots. */
export function StorefrontImage({ src, alt, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const source = clearPresetImage(typeof src === "string" ? src : "");
  const description = source === "/assets/owner-zips-2026/s2-13-wellness-photo.webp" ? "Shea butter applied to skin in a daily care ritual" : source === "/assets/owner-zips-2026/face-oil-ritual.webp" ? "A botanical facial oil care ritual" : alt;
  const imageClass = source ? className : className?.replace("shea-rotated-product-image", "");
  return <img {...props} className={imageClass} src={source || undefined} alt={source ? description : ""} data-image-label={alt || "Page image"} data-image-slot />;
}
