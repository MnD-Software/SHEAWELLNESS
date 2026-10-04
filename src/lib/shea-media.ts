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
