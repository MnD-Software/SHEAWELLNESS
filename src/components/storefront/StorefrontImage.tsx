import type { ImgHTMLAttributes } from "react";
import { clearPresetImage } from "@/lib/shea-media";

/** An editable image slot. Empty slots never request or display preset photos. */
export function StorefrontImage({ src, alt, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const source = clearPresetImage(typeof src === "string" ? src : "");
  const imageClass = source ? className : className?.replace("shea-rotated-product-image", "");
  return <img {...props} className={imageClass} src={source || undefined} alt={source ? alt : ""} data-image-label={alt || "Page image"} data-image-slot />;
}
