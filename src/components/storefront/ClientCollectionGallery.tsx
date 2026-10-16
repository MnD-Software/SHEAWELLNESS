import { StorefrontImage } from "./StorefrontImage";
import { clientAsset } from "@/lib/client-media";

const collections = {
  gifts: [["wellness-gift.png", "Wellness gifts, thoughtfully presented."], ["shea-gift-collection.png", "A collection of nourishing shea butter infusions."]],
  skin: [["product-shea-butter.png", "Lavender, grapefruit, lemongrass and vanilla mint."], ["tea-tree.png", "Tea Tree Infusion — hair, body and face butter."]],
  about: [["shea-harvest.png", "Rooted in African botanical heritage."], ["shea-ingredients.png", "Shea at the heart of our collection."]]
};
export function ClientCollectionGallery({ kind }: { kind: keyof typeof collections }) {
  return <section className="client-collection-gallery" aria-label="Shea Wellness collection photographs" data-live-content data-cms-exclude>{collections[kind].map(([file, caption]) => <figure key={file}><StorefrontImage src={clientAsset(file)} alt={caption} loading="lazy" /><figcaption>{caption}</figcaption></figure>)}</section>;
}
