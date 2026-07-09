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

const whatsappImageFiles = [
  "WhatsApp Image 2026-07-07 at 11.44.10.jpeg",
  "WhatsApp Image 2026-07-07 at 11.48.21 (1).jpeg",
  "WhatsApp Image 2026-07-07 at 11.48.21 (2).jpeg",
  "WhatsApp Image 2026-07-07 at 11.48.21.jpeg",
  "WhatsApp Image 2026-07-08 at 11.46.26 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 11.46.26 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 11.46.26.jpeg",
  "WhatsApp Image 2026-07-08 at 11.48.35.jpeg",
  "WhatsApp Image 2026-07-08 at 12.03.57.jpeg",
  "WhatsApp Image 2026-07-08 at 12.03.58.jpeg",
  "WhatsApp Image 2026-07-08 at 12.04.41.jpeg",
  "WhatsApp Image 2026-07-08 at 12.04.42 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.04.42.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.20 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.20.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.21 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.21 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.21.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.22 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.22 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.22.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.23 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.23 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.23.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.24 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.24.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.25 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.25 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.25.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.26 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.26 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.26.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.27 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.27 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.27 (3).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.27.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.28 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.28 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.28 (3).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.28 (4).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.28.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.29 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.29 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.29 (3).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.29.jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.30 (1).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.30 (2).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.30 (3).jpeg",
  "WhatsApp Image 2026-07-08 at 12.44.30.jpeg"
];

const whatsappVideoFiles = [
  "WhatsApp Video 2026-07-07 at 11.44.58.mp4",
  "WhatsApp Video 2026-07-07 at 11.44.59.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.00.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.01.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.02.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.04.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.05.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.06.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.07.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.08.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.09.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.16.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.31.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.32.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.34.mp4",
  "WhatsApp Video 2026-07-07 at 11.45.36.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.07.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.09.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.10.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.20.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.22.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.24.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.25.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.26.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.42.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.45.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.47.mp4",
  "WhatsApp Video 2026-07-07 at 11.46.49.mp4",
  "WhatsApp Video 2026-07-07 at 11.47.52.mp4",
  "WhatsApp Video 2026-07-07 at 11.47.53.mp4",
  "WhatsApp Video 2026-07-07 at 11.47.55.mp4",
  "WhatsApp Video 2026-07-07 at 11.48.22.mp4",
  "WhatsApp Video 2026-07-07 at 11.48.24.mp4",
  "WhatsApp Video 2026-07-07 at 11.48.43.mp4",
  "WhatsApp Video 2026-07-07 at 11.48.44.mp4",
  "WhatsApp Video 2026-07-07 at 11.48.45.mp4",
  "WhatsApp Video 2026-07-07 at 11.48.46.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.02.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.03.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.05.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.06.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.07.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.08.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.47.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.49.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.50.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.51.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.52.mp4",
  "WhatsApp Video 2026-07-07 at 11.49.53.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.04.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.05.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.06.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.07.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.08.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.09.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.10.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.11.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.12.mp4",
  "WhatsApp Video 2026-07-07 at 11.50.14 (1).mp4",
  "WhatsApp Video 2026-07-07 at 11.50.14.mp4"
];

export const sheaHeroSlides: SheaHeroSlide[] = [
  {
    id: "skin_hair_face_spa",
    title: "Skin care. Hair care. Face care. Spa essentials.",
    kicker: "Natural wellness routines",
    body: "Natural products for problematic skin concerns including eczema, psoriasis, hyperpigmentation, stretch marks, acne, and dark marks.",
    src: "/assets/sheawellness/face-care-routine.png",
    type: "image",
    tag: "Routine Guide",
    ctaLabel: "Shop routines",
    ctaHref: "/shop",
    objectPosition: "50% 50%"
  },
  {
    id: "sensitive_skin_safe",
    title: "100% natural ingredients, safe and effective for sensitive skin.",
    kicker: "Gentle and effective",
    body: "Cleanse without stripping, moisturize while skin is damp, and protect the skin's natural barrier with plant-based care.",
    src: "/assets/WhatsApp Image 2026-07-08 at 12.04.41.jpeg",
    type: "image",
    tag: "Body Care",
    ctaLabel: "View body care",
    ctaHref: "/collections/body-care",
    objectPosition: "50% 50%"
  },
  {
    id: "face_care_collection",
    title: "Nourish. Protect. Glow naturally.",
    kicker: "Face care",
    body: "A simple routine with African Liquid Black Soap, Rosehip Facial Oil, and Lavender Shea Butter for clean, hydrated, radiant-looking skin.",
    src: "/assets/WhatsApp Image 2026-07-08 at 12.03.58.jpeg",
    type: "image",
    tag: "Face Care",
    ctaLabel: "Explore face care",
    ctaHref: "/collections/face-care",
    objectPosition: "50% 50%"
  },
  {
    id: "body_glow_collection",
    title: "Glow naturally. Nourish deeply. Shine every day.",
    kicker: "Fresh body glow",
    body: "African black soap, grapefruit shea butter, and soothing body oil work together to cleanse, moisturize, and seal in radiance.",
    src: "/assets/WhatsApp Image 2026-07-08 at 12.44.30 (3).jpeg",
    type: "image",
    tag: "Moisture Routine",
    ctaLabel: "Start routine",
    ctaHref: "/shop",
    objectPosition: "50% 50%"
  }
];

export const sheaImageMedia: SheaMediaAsset[] = [
  "/assets/sheawellness/face-care-routine.png",
  "/assets/sheawellness/pure-raw-shea-butter.jpeg",
  "/assets/sheawellness/lavender-shea-butter-front.jpeg",
  "/assets/sheawellness/lemongrass-shea-butter-front.jpeg",
  "/assets/sheawellness/grapefruit-shea-butter-front.jpeg",
  "/assets/sheawellness/vanilla-mint-shea-butter.jpeg",
  "/assets/sheawellness/lavender-shea-butter-back.jpeg"
].map((src, index) => ({
  id: `product_image_${index + 1}`,
  title: `Product image ${index + 1}`,
  src,
  type: "image" as const,
  tag: "Product"
})).concat(whatsappImageFiles.map((file, index) => ({
  id: `campaign_image_${index + 1}`,
  title: `Campaign image ${index + 1}`,
  src: `/assets/${file}`,
  type: "image" as const,
  tag: index < 7 ? "Brand asset" : "Skin routine"
})));

export const sheaNav = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Blog", href: "/blog" },
  { label: "Quality", href: "/quality" },
  { label: "Contact", href: "/contact" }
];

export const sheaProductCategories = [
  {
    name: "Body Care",
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
        image: "/assets/WhatsApp Image 2026-07-08 at 12.44.27 (3).jpeg",
        description: "Gentle daily cleanser for face and body that removes impurities without a stripped feeling.",
        ingredients: ["African Black Soap", "Shea Butter", "Botanical Extracts"],
        benefits: ["Gently cleanses", "Maintains moisture balance", "Prepares skin for facial oils"],
        sizes: ["150ml", "300ml", "500ml", "Spa refill"],
        usage: "Use with lukewarm water, massage gently in circular motions, rinse thoroughly, and moisturize while skin is still slightly damp."
      },
      {
        name: "Rosehip Facial Oil",
        image: "/assets/sheawellness/face-care-routine.png",
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
        image: "/assets/sheawellness/face-care-routine.png",
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
        image: "/assets/shea-chebe-haircare.png",
        description: "A nourishing serum for protective styles, length retention, and scalp care.",
        ingredients: ["Chebe Powder", "Karkar Oil", "Natural Oils"],
        benefits: ["Length retention", "Strengthens hair strands", "Adds shine"],
        sizes: ["50ml", "100ml"],
        usage: "Apply sparingly to scalp or hair lengths and massage gently."
      },
      {
        name: "Chebe Hair Butter",
        image: "/assets/shea-chebe-haircare.png",
        description: "Rich hair butter for nourishment, shine, and breakage prevention.",
        ingredients: ["Shea Butter", "Chebe", "Natural Oils"],
        benefits: ["Rich nourishment", "Prevents breakage", "Improves manageability"],
        sizes: ["100g", "250g"],
        usage: "Apply to damp hair, focusing on ends and dry sections."
      },
      {
        name: "African Liquid Black Soap Shampoo",
        image: "/assets/WhatsApp Image 2026-07-08 at 12.44.25.jpeg",
        description: "A natural shampoo option for clean scalp and hair care routines.",
        ingredients: ["African Black Soap", "Shea Butter", "Botanical Extracts"],
        benefits: ["Cleanses scalp", "Removes buildup", "Supports natural hair care"],
        sizes: ["250ml", "500ml"],
        usage: "Massage into wet hair and scalp, then rinse thoroughly."
      },
      {
        name: "Cold Pressed Yellow Castor Oil",
        image: "/assets/sheawellness/face-care-routine.png",
        description: "A rich oil for dry scalp, brittle hair, protective styles, and body moisture sealing.",
        ingredients: ["Cold Pressed Yellow Castor Oil"],
        benefits: ["Moisturizes dry scalp", "Softens brittle hair", "Seals in moisture"],
        sizes: ["100ml", "250ml"],
        usage: "Massage a small amount into the scalp or apply through hair lengths and ends."
      },
      {
        name: "Rosemary Essential Oil Scalp Boost",
        image: "/assets/shea-essential-oils.png",
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
      image: "/assets/shea-essential-oils.png",
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
        image: "/assets/shea-essential-oils.png",
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
        image: "/assets/shea-hero.png",
        description: "Clean, professional disposable bed sheets for spa treatment rooms.",
        ingredients: ["Disposable spa-grade material"],
        benefits: ["Hygienic setup", "Easy room turnover", "Professional presentation"],
        sizes: ["Single pack", "Salon pack", "Wholesale carton"],
        usage: "Use once per client service and dispose according to local hygiene practice."
      },
      {
        name: "Disposable Pants & Bras",
        image: "/assets/shea-hero.png",
        description: "Disposable client wear for massage, spa, and salon treatments.",
        ingredients: ["Disposable spa-grade material"],
        benefits: ["Client comfort", "Spa hygiene", "Treatment-room readiness"],
        sizes: ["Starter pack", "Salon pack", "Wholesale carton"],
        usage: "Provide to clients before body treatments."
      },
      {
        name: "Massage Oils",
        image: "/assets/shea-essential-oils.png",
        description: "Energizing, relaxing, and detoxifying blends for body treatments.",
        ingredients: ["Natural Oils", "Essential Oil Blends"],
        benefits: ["Smooth massage glide", "Relaxing aroma", "Spa-grade treatment support"],
        sizes: ["250ml", "500ml", "Salon refill"],
        usage: "Warm in hands before massage and avoid sensitive areas."
      },
      {
        name: "Professional Salon Equipment",
        image: "/assets/shea-hero.png",
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
    tag: "Body Care"
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
  })),
  ...whatsappVideoFiles.map((file, index) => ({
    id: `campaign_video_${index + 1}`,
    title: `Campaign video ${index + 1}`,
    src: `/assets/${file}`,
    type: "video" as const,
    tag: "New media"
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
