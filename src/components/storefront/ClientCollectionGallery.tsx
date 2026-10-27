import { StorefrontImage } from "./StorefrontImage";
import { clientAsset } from "@/lib/client-media";

const collections = {
  gifts: [["revisions/wellness-gift.jpeg", "Shea Wellness gift collection"]],
  skin: [["product-shea-butter.png", "Shea Wellness botanical butter collection"]],
  about: [["shea-harvest.png", "Rooted in African botanical heritage."], ["shea-ingredients.png", "Shea at the heart of our collection."]]
};
export function ClientCollectionGallery({ kind }: { kind: keyof typeof collections }) {
  return <section className={`client-collection-gallery${kind !== "about" ? " client-collection-gallery-wide" : ""}`} aria-label="Shea Wellness collection photographs" data-live-content data-cms-exclude>{collections[kind].map(([file, caption]) => <figure key={file}><StorefrontImage src={clientAsset(file)} alt={caption} loading="lazy" />{kind === "about" ? <figcaption>{caption}</figcaption> : null}</figure>)}</section>;
}
