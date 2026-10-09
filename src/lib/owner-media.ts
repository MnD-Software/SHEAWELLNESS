// Assets supplied by the owner on 9 October 2026. Retired website presets remain detached.
export const ownerAsset = (name: string) => `/assets/owner-oct-2026/${name}`;
export const ownerRoutineImages: Record<string, { front: string; detail: string }> = {
  "dry-flaky-skin": { front: "routine-dry-skin.webp", detail: "routine-dry-care.webp" },
  "sensitive-skin": { front: "routine-sensitive-skin.webp", detail: "routine-sensitive-care.webp" },
  "body-glow": { front: "routine-body-glow.webp", detail: "routine-body-care.webp" },
  "face-care": { front: "routine-face.webp", detail: "routine-face-care.webp" },
  "hair-scalp": { front: "hair-oil-poster.webp", detail: "hair-butter-poster.webp" },
  "spa-essentials": { front: "routine-spa-front.webp", detail: "routine-spa-care.webp" }
};
export const ownerProductImages: Record<string, string> = {
  prod_pure_raw: "pure-raw-shea.webp",
  prod_black_soap: "black-soap-face.webp",
  prod_vanilla_mint: "vanilla-mint-200.webp",
  prod_lavender: "lavender-200.webp",
  prod_grapefruit: "grapefruit-200.webp",
  prod_essential_oils: "essential-lavender.webp",
  prod_aromatherapy: "diffuser-wood.webp",
  prod_soothing_body_oil: "massage-oils.webp",
  prod_chebe_serum: "hair-oil-poster.webp",
  prod_chebe_butter: "hair-butter-poster.webp"
};
export const ownerVideos = [
  ["African liquid black soap", "african-liquid-black-soap.mp4"],
  ["Pure & raw shea butter", "pureand-raw-shea-butter.mp4"],
  ["Vanilla mint shea butter", "vanilla-mint.mp4"],
  ["Lavender shea butter", "lavender-video.mp4"],
  ["Chebe hair serum", "hair-oil.mp4"],
  ["Chebe hair butter", "hair-butter.mp4"],
  ["Aroma diffuser demonstration 1", "humidifier.mp4"],
  ["Aroma diffuser demonstration 2", "humidifier2.mp4"],
  ["Aroma diffuser demonstration 3", "humidifer-3.mp4"],
  ["Energizing massage oil", "energize-massage-oil.mp4"],
  ["Deep-tissue massage oil", "deep-tissue-massage.mp4"],
  ["Castor oil", "caster-oil.mp4"],
  ["Vitamin oil", "vitamine.mp4"],
  ["Neem oil", "neem-oil.mp4"],
  ["Mosquito repellents", "mosquito-repelant.mp4"],
  ["Shea Wellness product film 1", "owner-film-01.mp4"],
  ["Shea Wellness product film 2", "owner-film-02.mp4"],
  ["Shea Wellness product film 3", "owner-film-03.mp4"]
] as const;
export const ownerDownloads = [
  { title: "Shea Wellness brochure", body: "Skin care, hair care, wellness and spa essentials, with brand and contact information.", file: "wellness-brochure.pdf", cover: "wellness-brochure-cover.webp", detail: "PDF · 2 pages" },
  { title: "Cosmetics & wellness flyer", body: "Explore the product ranges and Shea Wellness brand stories.", file: "cosmetics-flyer.pdf", cover: "cosmetics-flyer-cover.webp", detail: "PDF · 7 pages" }
] as const;
