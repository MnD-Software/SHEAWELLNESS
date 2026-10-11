import { retiredPresetImagePaths } from "./retired-preset-images";

// Explicit replacements use the owner's supplied files, never stock imagery.
const suppliedImageReplacements: Record<string, string> = {
  "/assets/website-edits/community-impact.png": "/assets/owner-zips-2026/brand-gold.webp",
  "/assets/website-edits/facial-oils.jpg": "/assets/owner-zips-2026/face-oil-ritual.webp",
  "/assets/website-edits/spa-facial.jpg": "/assets/owner-zips-2026/face-oil-ritual.webp",
  "/assets/website-edits/black-soap-routine.jpg": "/assets/owner-oct-2026/black-soap-face.webp",
  "/assets/website-edits/black-soap-face-wash.jpg": "/assets/owner-oct-2026/black-soap-face.webp",
  "/assets/website-edits/black-soap-body-wash-pair.jpg": "/assets/owner-oct-2026/black-soap-body.webp",
  "/assets/sheawellness/pure-raw-shea-butter.jpeg": "/assets/owner-zips-2026/pure-raw-front.webp",
  "/assets/sheawellness/vanilla-mint-shea-butter.jpeg": "/assets/owner-zips-2026/vanilla-mint-open.webp",
  "/assets/sheawellness/lavender-shea-butter-front.jpeg": "/assets/owner-zips-2026/lavender-front.webp",
  "/assets/sheawellness/lavender-shea-butter-back.jpeg": "/assets/owner-zips-2026/lavender-back.webp",
  "/assets/sheawellness/grapefruit-shea-butter-front.jpeg": "/assets/owner-zips-2026/grapefruit-front.webp",
  "/assets/sheawellness/lemongrass-shea-butter-front.jpeg": "/assets/owner-zips-2026/lemongrass-front.webp",
  "/assets/sheawellness/lemongrass-shea-butter-lid.jpeg": "/assets/owner-zips-2026/lemongrass-open.webp",
  "/assets/media-library/aug-2026/aug-2026-028.jpeg": "/assets/owner-oct-2026/hair-oil-poster.webp",
  "/assets/media-library/aug-2026/aug-2026-057.jpeg": "/assets/owner-zips-2026/spa-collection.webp"
};

/** Retire existing presets while allowing the owner to upload or add new files. */
export function clearPresetImage(src: string | null | undefined): string {
  if (!src) return "";
  const source = src.trim();
  try {
    const path = decodeURIComponent(new URL(source, "https://shea.local").pathname);
    if (suppliedImageReplacements[path]) return suppliedImageReplacements[path];
    if (retiredPresetImagePaths.has(path) || path.startsWith("/assets/WhatsApp Image ")) return "";
  } catch {
    return "";
  }
  return source;
}

/**
 * Some of the supplied black-soap source photos were exported without EXIF
 * orientation metadata. Keep the correction explicit and narrowly scoped so
 * it never affects future uploads or customer-provided media.
 */
const sidewaysSheaAssetSuffixes = [
  "/assets/website-edits/black-soap-routine.jpg",
  "/assets/website-edits/black-soap-face-wash.jpg",
  "/assets/website-edits/black-soap-face-wash-pair.jpg",
  "/assets/website-edits/black-soap-collection.jpg",
  "/assets/website-edits/black-soap-body-wash.jpg",
  "/assets/website-edits/black-soap-body-wash-pair.jpg",
] as const;

export function isSidewaysSheaProductAsset(assetPath: string | null | undefined) {
  if (!assetPath) return false;

  const normalizedPath = assetPath.split(/[?#]/, 1)[0].toLowerCase();
  return sidewaysSheaAssetSuffixes.some((suffix) => normalizedPath.endsWith(suffix));
}
