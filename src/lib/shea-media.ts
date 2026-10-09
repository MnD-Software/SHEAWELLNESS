import { retiredPresetImagePaths } from "./retired-preset-images";

/** Retire existing presets while allowing the owner to upload or add new files. */
export function clearPresetImage(src: string | null | undefined): string {
  if (!src) return "";
  const source = src.trim();
  try {
    const path = decodeURIComponent(new URL(source, "https://shea.local").pathname);
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
