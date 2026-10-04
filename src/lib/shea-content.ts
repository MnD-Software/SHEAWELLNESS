export const sheaBrand = {
  name: "Shea Wellness LTD",
  headline: "Pure Nilotica Shea. Modern Wellness.",
  summary: "Care inspired by nature. Wellness for every skin, every home, and every generation.",
  email: "sheabutterwellness@gmail.com",
  phone: "+254729621930",
  address: "Unga House, 1st Floor, Westlands, Nairobi",
  promises: ["Natural Ingredients", "Gentle and Effective", "Nourish and Hydrate", "Healthy Glow"],
  standards: ["Responsible sourcing", "Ethical supply chains", "Conscious production", "Thoughtful packaging"]
};

export type SheaMediaAsset = {
  id: string;
  title: string;
  src: string;
  type: "image" | "video";
  tag: string;
  objectPosition?: string;
};

export type SheaHeroSlide = SheaMediaAsset & {
  kicker: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export type SheaMediaConfig = {
  heroSlides: SheaHeroSlide[];
  images: SheaMediaAsset[];
  videos: SheaMediaAsset[];
};

const retiredSyntheticImages: Record<string, string> = {
  "/assets/shea-hero.png": "/assets/sheawellness/pure-raw-shea-butter.jpeg",
  "/assets/shea-essential-oils.png": "/assets/sheawellness/lemongrass-shea-butter-front.jpeg",
  "/assets/shea-chebe-haircare.png": "/assets/sheawellness/pure-raw-shea-butter.jpeg",
  "/assets/shea-body-butter.png": "/assets/sheawellness/lavender-shea-butter-front.jpeg",
  "/assets/shea-black-soap.png": "/assets/website-edits/black-soap-collection.jpg",
  "/assets/sheawellness/face-care-routine.png": "/assets/website-edits/facial-oils.jpg",
  "/assets/sheawellness/face-care-routine-hero.png": "/assets/website-edits/facial-oils.jpg"
};

const legacyMediaPathPrefixes = ["/assets/WhatsApp Image ", "/assets/WhatsApp Video "];

// Older deployments imported every received WhatsApp and August media file
// into the editable library. Those generated identifiers are not an editorial
// choice and caused retired imagery to return whenever the persisted content
// record was read again.
const legacyBulkMediaId = /^(?:product_image_\d+|august_2026_(?:image|video)_\d+|images_\d+|page_image_\d+)$/;

export function isLegacySheaMediaPath(src: string) {
  return legacyMediaPathPrefixes.some((prefix) => src.startsWith(prefix));
}

export function replaceRetiredSyntheticImage(src: string) {
  return retiredSyntheticImages[src] ?? src;
}

function sanitizeMediaAssets<T extends SheaMediaAsset>(assets: T[]) {
  return assets.flatMap((asset) => {
    const src = typeof asset?.src === "string" ? replaceRetiredSyntheticImage(asset.src) : "";
    return src && !isLegacySheaMediaPath(src) ? [{ ...asset, src }] : [];
  });
}

function isLegacyBulkMediaAsset(asset: SheaMediaAsset) {
  return legacyBulkMediaId.test(asset.id);
}

function mergeCuratedMedia<T extends SheaMediaAsset>(defaults: T[], saved: T[]) {
  const defaultIds = new Set(defaults.map((asset) => asset.id));
  const defaultSources = new Set(defaults.map((asset) => asset.src));
  const retainedSaved = saved.filter((asset) => (
    !isLegacyBulkMediaAsset(asset)
    && !defaultIds.has(asset.id)
    && !defaultSources.has(asset.src)
  ));

  return [...defaults, ...retainedSaved];
}

export function sanitizeSheaMediaConfig(config: SheaMediaConfig): SheaMediaConfig {
  const heroSlides = Array.isArray(config?.heroSlides) ? config.heroSlides : [];
  const images = Array.isArray(config?.images) ? config.images : [];
  const videos = Array.isArray(config?.videos) ? config.videos : [];

  const safeHeroSlides = sanitizeMediaAssets(heroSlides);
  const safeImages = sanitizeMediaAssets(images);
  const safeVideos = sanitizeMediaAssets(videos);
  const includesLegacyBulkImport = [...safeHeroSlides, ...safeImages, ...safeVideos].some(isLegacyBulkMediaAsset);

  if (includesLegacyBulkImport) {
    return {
      // Restore the concise, approved storefront media instead of exposing the
      // historic bulk library. Explicitly added media is retained when it does
      // not collide with an approved source or a retired generated identifier.
      heroSlides: mergeCuratedMedia(sheaHeroSlides, safeHeroSlides),
      images: mergeCuratedMedia(sheaImageMedia, safeImages),
      videos: mergeCuratedMedia(sheaVideos, safeVideos)
    };
  }

  return {
    heroSlides: sanitizeMediaAssets(heroSlides),
    // An empty collection is a valid editorial decision. Do not merge defaults
    // back into saved content, otherwise deleted media returns on the next load.
    images: sanitizeMediaAssets(images),
    videos: sanitizeMediaAssets(videos)
  };
}

export const sheaHeroSlides: SheaHeroSlide[] = [
  {
    id: "skin_hair_face_spa",
    title: "SKIN CARE. HAIR CARE. FACE CARE. SPA ESSENTIALS",
    kicker: "Complete natural care",
    body: "Shea Wellness believes healthy skin begins with nature.",
    src: "/assets/website-edits/black-soap-routine.jpg",
    type: "image",
    tag: "Routine Guide",
    ctaLabel: "Shop routines",
    ctaHref: "/shop",
    objectPosition: "50% 50%"
  },
  {
    id: "sensitive_skin_safe",
    title: "Natural Products for Problematic Skin Concerns.",
    kicker: "Nature-led solutions",
    body: "Gentle routines designed to cleanse, nourish, moisturize, and protect the skin's natural barrier.",
    src: "/assets/website-edits/spa-facial.jpg",
    type: "image",
    tag: "Skin Care",
    ctaLabel: "View skin care",
    ctaHref: "/collections/skin-care",
    objectPosition: "50% 50%"
  },
  {
    id: "face_care_collection",
    title: "Eczema, Psoriasis, Hyperpigmentation, Stretch Marks, Acne, Dark Marks.",
    kicker: "Care by concern",
    body: "Explore practical face, skin, hair, and body routines with clear product guidance.",
    src: "/assets/website-edits/facial-oils.jpg",
    type: "image",
    tag: "Face Care",
    ctaLabel: "Explore face care",
    ctaHref: "/collections/face-care",
    objectPosition: "50% 50%"
  },
  {
    id: "body_glow_collection",
    title: "100% Natural Ingredients, Safe and Effective for Sensitive Skin",
    kicker: "Gentle and effective",
    body: "Pure shea butter, botanical oils, and natural plant extracts for thoughtful everyday wellness.",
    src: "/assets/website-edits/pure-raw-shea-butter.jpg",
    type: "image",
    tag: "Moisture Routine",
    ctaLabel: "Start routine",
    ctaHref: "/shop",
    objectPosition: "50% 50%"
  }
];

const curatedImageMedia: Array<Omit<SheaMediaAsset, "id">> = [
  { title: "Community impact", src: "/assets/website-edits/community-impact.png", type: "image", tag: "Brand story" },
  { title: "Spa facial", src: "/assets/website-edits/spa-facial.jpg", type: "image", tag: "Spa care" },
  { title: "Massage oils", src: "/assets/website-edits/massage-oils.jpg", type: "image", tag: "Spa essentials" },
  { title: "Facial oils", src: "/assets/website-edits/facial-oils.jpg", type: "image", tag: "Face care" },
  { title: "Body oils", src: "/assets/website-edits/body-oils-collection.jpg", type: "image", tag: "Skin care" },
  { title: "Botanical oils", src: "/assets/website-edits/botanical-oils.jpg", type: "image", tag: "Wellness routine" },
  { title: "Pure raw shea butter", src: "/assets/sheawellness/pure-raw-shea-butter.jpeg", type: "image", tag: "Verified product" },
  { title: "Lavender shea butter", src: "/assets/sheawellness/lavender-shea-butter-front.jpeg", type: "image", tag: "Verified product" },
  { title: "Lemongrass shea butter", src: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg", type: "image", tag: "Verified product" },
  { title: "Grapefruit shea butter", src: "/assets/sheawellness/grapefruit-shea-butter-front.jpeg", type: "image", tag: "Verified product" },
  { title: "Vanilla mint shea butter", src: "/assets/sheawellness/vanilla-mint-shea-butter.jpeg", type: "image", tag: "Verified product" },
  { title: "Chebe hair serum", src: "/assets/media-library/aug-2026/aug-2026-026.jpeg", type: "image", tag: "Verified product" },
  { title: "Chebe hair butter", src: "/assets/media-library/aug-2026/aug-2026-043.jpeg", type: "image", tag: "Verified product" },
  { title: "Yellow castor oil", src: "/assets/media-library/aug-2026/aug-2026-028.jpeg", type: "image", tag: "Verified product" },
  { title: "Essential oils", src: "/assets/media-library/aug-2026/aug-2026-025.jpeg", type: "image", tag: "Verified product" },
  { title: "Aromatherapy bundle", src: "/assets/media-library/aug-2026/aug-2026-030.jpeg", type: "image", tag: "Verified product" },
  { title: "Professional spa essentials", src: "/assets/media-library/aug-2026/aug-2026-057.jpeg", type: "image", tag: "Verified product" }
];

export const sheaImageMedia: SheaMediaAsset[] = curatedImageMedia.map((asset, index) => ({
  id: `curated_image_${index + 1}`,
  ...asset
}));

export const sheaNav = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Wellness Guides", href: "/wellness-guides" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Blog", href: "/blog" },
  { label: "Quality", href: "/quality" },
  { label: "Contact", href: "/contact" }
];

export const sheaProductCategories = [
  {
    name: "Skin Care",
    summary: "Shea body butter infusions for deep hydration, dry skin repair, elasticity, and daily glow.",
    products: [
      {
        name: "Pure & Raw Shea Butter",
        image: "/assets/sheawellness/pure-raw-shea-butter.jpeg",
        description: "Unfragranced raw shea butter for body, face, and hair.",
        ingredients: ["Raw Shea Butter"],
        benefits: ["Deep hydration", "Repairs dry skin", "Supports anti-aging routines"],
        sizes: ["100g", "250g", "500g"],
        usage: "Warm a small amount between palms and massage into clean skin or hair."
      },
      {
        name: "Lavender Shea Body Butter Infusion",
        image: "/assets/sheawellness/lavender-shea-butter-front.jpeg",
        description: "A calming shea butter infusion for dry, sensitive, and irritated skin.",
        ingredients: ["Raw Shea Butter", "Lavender Essential Oil", "Vitamin E"],
        benefits: ["Deeply moisturizes skin", "Improves elasticity", "Calms irritated skin"],
        sizes: ["100g", "250g", "500g"],
        usage: "Apply after bathing or before bed for a calming moisture routine."
      },
      {
        name: "Lemongrass Shea Body Butter Infusion",
        image: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg",
        description: "A fresh botanical butter for daily body and face moisture.",
        ingredients: ["Raw Shea Butter", "Lemongrass Essential Oil", "Vitamin E"],
        benefits: ["Softens rough skin", "Refreshes the senses", "Supports a healthy-looking glow"],
        sizes: ["100g", "250g", "500g"],
        usage: "Massage onto damp skin after showering."
      },
      {
        name: "Vanilla-Mint Shea Body Butter Infusion",
        image: "/assets/sheawellness/vanilla-mint-shea-butter.jpeg",
        description: "A cooling and comforting butter for body and face.",
        ingredients: ["Raw Shea Butter", "Vanilla", "Mint Oil", "Vitamin E"],
        benefits: ["Nourishes dry patches", "Leaves skin supple", "Comforting aromatic finish"],
        sizes: ["100g", "250g", "500g"],
        usage: "Use daily on body, elbows, knees, feet, and dry areas."
      },
      {
        name: "Grapefruit Shea Body Butter Infusion",
        image: "/assets/sheawellness/grapefruit-shea-butter-front.jpeg",
        description: "A bright citrus butter for body and face care.",
        ingredients: ["Raw Shea Butter", "Grapefruit Essential Oil", "Vitamin E"],
        benefits: ["Hydrates deeply", "Bright citrus scent", "Helps revive dull-looking skin"],
        sizes: ["100g", "250g", "500g"],
        usage: "Apply a thin layer and reapply as needed throughout the day."
      }
    ]
  },
  {
    name: "Face Care",
    summary: "African liquid black soap cleansers for gentle detox, acne-prone skin, and even tone support.",
    products: [
      {
        name: "African Liquid Black Soap Body & Face Wash",
        image: "/assets/website-edits/black-soap-body-wash-pair.jpg",
        description: "Gentle daily cleanser for face and body that removes impurities without a stripped feeling.",
        ingredients: ["African Black Soap", "Shea Butter", "Botanical Extracts"],
        benefits: ["Gently cleanses", "Maintains moisture balance", "Prepares skin for facial oils"],
        sizes: ["150ml", "300ml", "500ml", "Spa refill"],
        usage: "Use with lukewarm water, massage gently in circular motions, rinse thoroughly, and moisturize while skin is still slightly damp."
      },
      {
        name: "Rosehip Facial Oil",
        image: "/assets/website-edits/facial-oils.jpg",
        description: "Lightweight botanical facial oil for daily moisture and a healthy-looking glow.",
        ingredients: ["Rosehip Oil", "Botanical Oil Blend"],
        benefits: ["Deep hydration", "Softens and smooths", "Supports the moisture barrier"],
        sizes: ["50ml", "100ml"],
        usage: "Apply 2-4 drops to slightly damp skin and gently press into the face and neck."
      },
      {
        name: "Lavender Shea Butter Overnight Barrier",
        image: "/assets/sheawellness/lavender-shea-butter-front.jpeg",
        description: "Rich overnight moisture support for dry areas on the face and neck.",
        ingredients: ["Raw Shea Butter", "Lavender Essential Oil", "Vitamin E"],
        benefits: ["Nourishes dry areas", "Helps reduce tightness", "Seals in moisture overnight"],
        sizes: ["100g", "250g", "330g"],
        usage: "Warm a very small amount between fingertips and press onto dry areas as the final evening step."
      },
      {
        name: "Cucumber Mint Sunscreen SPF Gel",
        image: "/assets/website-edits/facial-oils.jpg",
        description: "Daily SPF step for the morning routine to help protect skin from UV exposure.",
        ingredients: ["Cucumber", "Mint", "Broad-spectrum SPF"],
        benefits: ["Daily protection", "Light gel finish", "Supports a healthy barrier"],
        sizes: ["50ml"],
        usage: "Apply as the final morning step and reapply as needed during the day."
      }
    ]
  },
  {
    name: "Hair Care",
    summary: "Chebe and black soap hair care for length retention, stronger strands, shine, and breakage control.",
    products: [
      {
        name: "Chebe Hair Growth Serum with Karkar Oil",
        image: "/assets/media-library/aug-2026/aug-2026-026.jpeg",
        description: "A nourishing serum for protective styles, length retention, and scalp care.",
        ingredients: ["Chebe Powder", "Karkar Oil", "Natural Oils"],
        benefits: ["Length retention", "Strengthens hair strands", "Adds shine"],
        sizes: ["50ml", "100ml"],
        usage: "Apply sparingly to scalp or hair lengths and massage gently."
      },
      {
        name: "Chebe Hair Butter",
        image: "/assets/media-library/aug-2026/aug-2026-043.jpeg",
        description: "Rich hair butter for nourishment, shine, and breakage prevention.",
        ingredients: ["Shea Butter", "Chebe", "Natural Oils"],
        benefits: ["Rich nourishment", "Prevents breakage", "Improves manageability"],
        sizes: ["100g", "250g"],
        usage: "Apply to damp hair, focusing on ends and dry sections."
      },
      {
        name: "African Liquid Black Soap Shampoo",
        image: "/assets/website-edits/black-soap-collection.jpg",
        description: "A natural shampoo option for clean scalp and hair care routines.",
        ingredients: ["African Black Soap", "Shea Butter", "Botanical Extracts"],
        benefits: ["Cleanses scalp", "Removes buildup", "Supports natural hair care"],
        sizes: ["250ml", "500ml"],
        usage: "Massage into wet hair and scalp, then rinse thoroughly."
      },
      {
        name: "Cold Pressed Yellow Castor Oil",
        image: "/assets/media-library/aug-2026/aug-2026-028.jpeg",
        description: "A rich oil for dry scalp, brittle hair, protective styles, and body moisture sealing.",
        ingredients: ["Cold Pressed Yellow Castor Oil"],
        benefits: ["Moisturizes dry scalp", "Softens brittle hair", "Seals in moisture"],
        sizes: ["100ml", "250ml"],
        usage: "Massage a small amount into the scalp or apply through hair lengths and ends."
      },
      {
        name: "Rosemary Essential Oil Scalp Boost",
        image: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg",
        description: "A concentrated essential oil for diluted scalp massage blends.",
        ingredients: ["Rosemary Essential Oil"],
        benefits: ["Refreshes the scalp", "Complements hair routines", "Provides herbal aroma"],
        sizes: ["10ml", "30ml"],
        usage: "Dilute 2-3 drops in one tablespoon of castor oil before scalp massage."
      }
    ]
  },
  {
    name: "Essential Oils",
    summary: "Pure oils for relaxation, sleep, focus, skincare boosts, and aromatherapy routines.",
    products: ["Lavender", "Lemongrass", "Tea Tree", "Eucalyptus", "Peppermint", "Rosemary", "Sweet Orange", "Vanilla", "Rosemary and Tea Tree"].map((oil) => ({
      name: `${oil} Essential Oil`,
      image: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg",
      description: `${oil} essential oil for wellness, aroma, and skincare routines.`,
      ingredients: [`${oil} Essential Oil`],
      benefits: ["Relaxation", "Sleep and focus support", "Skincare boosts"],
      sizes: ["10ml", "30ml", "Wholesale pack"],
      usage: "Use in a diffuser or dilute appropriately before topical use."
    }))
  },
  {
    name: "Aromatherapy",
    summary: "Aromatherapy humidifiers and oil routines for spa, home, and wellness environments.",
    products: [
      {
        name: "Aromatherapy Humidifier",
        image: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg",
        description: "A diffuser-ready wellness device for essential oil routines.",
        ingredients: ["Humidifier Device", "Essential Oil Compatibility"],
        benefits: ["Relaxation", "Sleep support", "Spa ambience"],
        sizes: ["Single unit", "Spa bundle"],
        usage: "Add water and compatible essential oils according to the device guidance."
      }
    ]
  },
  {
    name: "Spa Essentials",
    summary: "Professional salon and spa supplies for treatment rooms, massage care, and wholesale clients.",
    products: [
      {
        name: "Disposable Massage Bed Sheets",
        image: "/assets/sheawellness/pure-raw-shea-butter.jpeg",
        description: "Clean, professional disposable bed sheets for spa treatment rooms.",
        ingredients: ["Disposable spa-grade material"],
        benefits: ["Hygienic setup", "Easy room turnover", "Professional presentation"],
        sizes: ["Single pack", "Salon pack", "Wholesale carton"],
        usage: "Use once per client service and dispose according to local hygiene practice."
      },
      {
        name: "Disposable Pants & Bras",
        image: "/assets/sheawellness/pure-raw-shea-butter.jpeg",
        description: "Disposable client wear for massage, spa, and salon treatments.",
        ingredients: ["Disposable spa-grade material"],
        benefits: ["Client comfort", "Spa hygiene", "Treatment-room readiness"],
        sizes: ["Starter pack", "Salon pack", "Wholesale carton"],
        usage: "Provide to clients before body treatments."
      },
      {
        name: "Massage Oils",
        image: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg",
        description: "Energizing, relaxing, and detoxifying blends for body treatments.",
        ingredients: ["Natural Oils", "Essential Oil Blends"],
        benefits: ["Smooth massage glide", "Relaxing aroma", "Spa-grade treatment support"],
        sizes: ["250ml", "500ml", "Salon refill"],
        usage: "Warm in hands before massage and avoid sensitive areas."
      },
      {
        name: "Professional Salon Equipment",
        image: "/assets/sheawellness/pure-raw-shea-butter.jpeg",
        description: "Professional wellness and salon supplies for treatment businesses.",
        ingredients: ["Salon equipment assortment"],
        benefits: ["Professional readiness", "Retail and spa support", "Distributor-friendly supply"],
        sizes: ["By request"],
        usage: "Request a wholesale catalogue for available equipment."
      }
    ]
  },
  {
    name: "Gift Sets",
    summary: "Curated Shea Wellness sets for self-care gifting, corporate gifting, and retail bundles.",
    products: [
      {
        name: "Shea Wellness Gift Set",
        image: "/assets/sheawellness/grapefruit-shea-butter-lid.jpeg",
        description: "A curated set of body butter, black soap, and essential oil options.",
        ingredients: ["Shea Body Butter", "African Black Soap", "Essential Oil"],
        benefits: ["Complete routine", "Gift-ready", "Retail bundle"],
        sizes: ["Mini set", "Signature set", "Corporate pack"],
        usage: "Use as a complete body, face, and aroma wellness routine."
      }
    ]
  },
  {
    name: "Offers",
    summary: "Seasonal retail offers, starter kits, and distributor entry bundles.",
    products: [
      {
        name: "Distributor Starter Offer",
        image: "/assets/sheawellness/lavender-shea-butter-lid.jpeg",
        description: "A wholesale-friendly introduction to Shea Wellness best sellers.",
        ingredients: ["Assorted Shea Wellness Products"],
        benefits: ["Retail trial pack", "Wholesale discovery", "Export-ready presentation"],
        sizes: ["Starter", "Growth", "Distributor"],
        usage: "Request pricing and availability through the wholesale form."
      }
    ]
  }
];

export const sheaWhyChoose = [
  { title: "Eco-friendly", body: "Sustainable sourcing and biodegradable packaging for responsible beauty." },
  { title: "Holistic", body: "Beauty aligned with health, wellness, and everyday self-care." },
  { title: "Authentic", body: "Indigenous African knowledge combined with modern wellness formulation." },
  { title: "Premium quality", body: "Natural ingredients, ethical sourcing, African heritage, and export-ready presentation." }
];

export const sheaWholesale = {
  partners: ["International retailers", "Wellness spas", "Organic beauty stores", "Distributors"],
  reasons: ["Premium African ingredients", "Private label opportunities", "Export-ready packaging", "Competitive wholesale pricing"],
  cta: "Request Wholesale Catalogue"
};

export const sheaSustainability = [
  "Ethical sourcing from African women cooperatives",
  "Support for communities and traditional production methods",
  "Natural ingredients that honor the body and planet",
  "Eco-friendly packaging and biodegradable presentation where possible"
];

export const sheaBlogTopics = [
  "Benefits of Shea Butter for Skin",
  "Natural Hair Care with Chebe",
  "Essential Oils for Stress Relief",
  "Organic Skincare Routine"
];

export const sheaQuality = ["Organic ingredients", "Dermatologically safe", "Export compliant", "Responsible manufacturing practices"];

export const sheaSocialProof = [
  { title: "Customer Review", body: "The lavender shea butter is deeply moisturizing and smells divine." },
  { title: "KAM Changamka Festival", body: "Expo participation through the Kenya Association of Manufacturers Changamka Festival." },
  { title: "Instagram Feed", body: "Product education, customer routines, and behind-the-scenes wellness content." },
  { title: "Media Mentions", body: "Brand credibility section ready for press, expo, and retail features." }
];

const baseSheaVideos: Array<Omit<SheaMediaAsset, "id">> = [
  {
    title: "Lavender butter texture",
    src: "/assets/sheawellness/product-video-01.mp4",
    type: "video",
    tag: "Skin Care"
  },
  {
    title: "Shea Wellness jar detail",
    src: "/assets/sheawellness/product-video-02.mp4",
    type: "video",
    tag: "Product Detail"
  },
  {
    title: "Infusion product routine",
    src: "/assets/sheawellness/product-video-03.mp4",
    type: "video",
    tag: "Wellness Routine"
  },
  {
    title: "Retail product showcase",
    src: "/assets/sheawellness/product-video-04.mp4",
    type: "video",
    tag: "Retail Ready"
  },
  {
    title: "Wholesale product media",
    src: "/assets/sheawellness/product-video-15.mp4",
    type: "video",
    tag: "Wholesale"
  }
];

export const sheaVideos: SheaMediaAsset[] = [
  ...baseSheaVideos.map((video, index) => ({
    id: `product_video_${index + 1}`,
    ...video
  }))
];

export const sheaDefaultMediaConfig: SheaMediaConfig = {
  heroSlides: sheaHeroSlides,
  images: sheaImageMedia,
  videos: sheaVideos
};

export const sheaCatalogueDownload = {
  title: "Product Catalogue Download",
  body: "A downloadable wholesale and retail product catalogue CTA is ready for the catalogue file once supplied.",
  cta: "Download Product Catalogue"
};
