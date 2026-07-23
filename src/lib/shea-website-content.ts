export type BotanicalDetail = {
  productId: string;
  scientificName: string;
  origin: string;
  nutrients: string[];
  benefits: string[];
  morning: string[];
  evening: string[];
  additionalUse?: string[];
  suitableFor: string[];
  caution: string;
};

export const botanicalDetails: BotanicalDetail[] = [
  {
    productId: "prod_rosehip_facial_oil",
    scientificName: "Rosa canina (Dog Rose)",
    origin: "Premium cold-pressed oil from wild rosehip seeds, selected to preserve its naturally occurring nutrients without heat or harsh chemicals.",
    nutrients: ["Vitamin A precursors", "Vitamin E", "Omega-3, 6 and 9 fatty acids", "Antioxidant compounds"],
    benefits: ["Lasting lightweight hydration", "Softer, smoother-looking texture", "Supports skin renewal", "Helps improve the appearance of fine lines and post-acne marks", "Restores a healthy-looking glow"],
    morning: ["Cleanse with African Liquid Black Soap.", "Press 2–3 drops onto slightly damp face, neck and décolletage.", "Allow 2–3 minutes to absorb.", "Finish with Cucumber Mint Sunscreen Gel SPF 20+."],
    evening: ["Cleanse and pat dry gently.", "Massage 3–5 drops upwards over face and neck.", "Focus on dry areas, fine lines, uneven tone and post-blemish marks.", "Leave overnight."],
    suitableFor: ["Dry", "Mature", "Normal", "Combination", "Sensitive skin; oily or acne-prone skin may use sparingly"],
    caution: "Patch test before first use and stop if irritation occurs."
  },
  {
    productId: "prod_yellow_castor_oil",
    scientificName: "Ricinus communis",
    origin: "Cold-pressed, unrefined castor seed oil. The castor plant is believed to have originated in East Africa and is now cultivated across tropical regions.",
    nutrients: ["Ricinoleic acid", "Omega-6 and 9 fatty acids", "Vitamin E", "Natural antioxidants"],
    benefits: ["Intensive moisture for dry skin", "Supports the skin moisture barrier", "Conditions dry scalp and brittle hair", "Helps reduce breakage through improved lubrication", "Softens cuticles, nails, elbows, knees and heels"],
    morning: ["Cleanse with African Liquid Black Soap.", "Warm 1–2 drops between palms and apply sparingly.", "Allow the rich oil to absorb.", "Finish with Cucumber Mint Sunscreen Gel SPF 20+."],
    evening: ["Cleanse and pat dry.", "Massage 2–4 drops onto dry areas of face and neck.", "For very dry skin, layer a small amount over Rosehip Oil.", "Leave overnight."],
    additionalUse: ["Massage into scalp, roots and ends for several hours or overnight.", "Apply a tiny amount to brows with a clean spoolie; avoid contact with eyes.", "Massage into hands, nails and cuticles before bed."],
    suitableFor: ["Dry", "Mature", "Normal", "Combination", "Dry scalp", "Natural, relaxed, braided and chemically treated hair"],
    caution: "This rich oil may not suit every oily or acne-prone skin type. Evidence that castor oil directly stimulates hair growth is limited."
  },
  {
    productId: "prod_cucumber_mint_sunscreen",
    scientificName: "Cucumber: Cucumis sativus · Peppermint: Mentha × piperita",
    origin: "A modern sunscreen formula pairing refreshing cucumber and peppermint with approved UV filters for comfortable daily use in warm climates.",
    nutrients: ["Cucumber botanical", "Peppermint botanical", "Approved broad-spectrum UV filters", "Hydrating gel base"],
    benefits: ["Helps protect against UVA and UVB exposure", "Supports prevention of sunburn and premature photoageing", "Helps prevent UV-related darkening of marks", "Lightweight hydration without a greasy finish", "Comfortable under makeup"],
    morning: ["Cleanse with African Liquid Black Soap.", "Apply Rosehip, Baobab, or a very small amount of Yellow Castor Oil.", "Allow facial oil to absorb for 2–3 minutes.", "Apply sunscreen generously to face, neck, ears and décolletage 15–20 minutes before exposure.", "Reapply at least every two hours outdoors and after swimming, sweating or towel drying."],
    evening: ["Remove sunscreen thoroughly with African Liquid Black Soap.", "Apply a suitable facial oil for overnight nourishment.", "Allow skin to rest overnight."],
    suitableFor: ["Normal", "Combination", "Oily", "Dry", "Mature", "Most sensitive skin types after patch testing"],
    caution: "Use the amount and reapplication directions on the product label. Sunscreen is only one part of sun protection."
  },
  {
    productId: "prod_baobab_oil",
    scientificName: "Adansonia digitata",
    origin: "Cold-pressed oil from seeds of the African baobab, traditionally valued across the continent and sourced to support sustainable African value chains.",
    nutrients: ["Vitamin E", "Omega-3, 6 and 9 fatty acids", "Palmitic, oleic and linoleic acids", "Natural antioxidants"],
    benefits: ["Long-lasting moisture", "Supports elasticity and the skin barrier", "Calms dry, uncomfortable-feeling skin", "Conditions curly, coily and textured hair", "Improves softness, manageability and shine"],
    morning: ["Cleanse with African Liquid Black Soap.", "Massage 2–4 drops onto slightly damp face, neck and décolletage.", "Allow 2–3 minutes to absorb.", "Finish with Cucumber Mint Sunscreen Gel SPF 20+."],
    evening: ["Cleanse and pat dry.", "Massage 3–5 drops onto face and neck.", "For added renewal support, apply Rosehip Oil first.", "Leave overnight."],
    additionalUse: ["Massage into scalp, roots and ends for at least 30 minutes or overnight.", "Use a small amount as a finishing oil for softness and shine.", "Apply to rough elbows, knees and heels."],
    suitableFor: ["Dry", "Sensitive", "Mature", "Normal", "Combination", "Curly, coily, textured and chemically treated hair", "Dry scalp"],
    caution: "Patch test before first use. This cosmetic product does not treat wounds or medical conditions."
  }
];

export const productPairings = [
  { concern: "Dry, flaky & ashy skin", products: ["African Liquid Black Soap", "Vanilla Mint Shea Butter", "Baobab Oil"], benefits: ["Gentle cleansing", "Barrier-supporting nourishment", "All-day moisture sealing"], bestFor: "Dry or mature skin, cold weather and dehydration" },
  { concern: "Dull, uneven & tired skin", products: ["African Liquid Black Soap", "Rosehip Oil", "Cucumber Mint Sunscreen Gel SPF 20+"], benefits: ["Removes impurities", "Supports radiance", "Protects against UV-related darkening"], bestFor: "Dullness, uneven-looking tone and early signs of ageing" },
  { concern: "Premature ageing & fine lines", products: ["African Liquid Black Soap", "Rosehip Oil", "Baobab Oil", "Cucumber Mint Sunscreen Gel SPF 20+"], benefits: ["Supports skin renewal", "Improves hydration and elasticity", "Protects against UV exposure"], bestFor: "Dryness-related fine lines and mature skin" },
  { concern: "Sensitive, irritated & easily dry skin", products: ["African Liquid Black Soap", "Baobab Oil", "Lavender Shea Butter"], benefits: ["Gentle cleansing", "Comforts dryness", "Deep hydration"], bestFor: "A simple moisture-barrier routine" },
  { concern: "Acne-prone skin & post-blemish marks", products: ["African Liquid Black Soap", "Rosehip Oil", "Cucumber Mint Sunscreen Gel SPF 20+"], benefits: ["Cleanses excess oil", "Lightweight nourishment", "Protects marks from UV-related darkening"], bestFor: "Blemish-prone skin after patch testing" },
  { concern: "Extremely dry hands & feet", products: ["Vanilla Mint Shea Butter", "Yellow Castor Oil"], benefits: ["Intensive overnight nourishment", "Softer heels and hands", "Conditioned nails and cuticles"], bestFor: "Targeted overnight care" },
  { concern: "Dry hair & flaky scalp", products: ["Yellow Castor Oil", "Baobab Oil"], benefits: ["Conditions scalp", "Improves softness and shine", "Helps reduce breakage"], bestFor: "Dry scalp and textured hair" },
  { concern: "Weak hair & split ends", products: ["Yellow Castor Oil", "Baobab Oil"], benefits: ["Seals in moisture", "Improves manageability", "Adds shine"], bestFor: "Brittle lengths and dry ends" },
  { concern: "Everyday skin protection", products: ["African Liquid Black Soap", "Rosehip Oil", "Cucumber Mint Sunscreen Gel SPF 20+"], benefits: ["Clean skin", "Daily nourishment", "UV protection"], bestFor: "A simple morning ritual" },
  { concern: "Rough elbows, knees & body", products: ["Baobab Oil", "Lavender Shea Butter"], benefits: ["Deep nourishment", "Improved softness", "Moisture sealing"], bestFor: "Rough, dry body areas" },
  { concern: "Healthy skin maintenance", products: ["AM: Black Soap → Rosehip Oil → Sunscreen", "PM: Black Soap → Rosehip Oil → Baobab Oil → Lavender Shea Butter"], benefits: ["Consistent cleansing", "Layered nourishment", "Daily protection"], bestFor: "An everyday face-and-body ritual" },
  { concern: "The ultimate skin reset", products: ["AM: Black Soap → Rosehip Oil → Sunscreen", "PM: Black Soap → Rosehip Oil → Baobab Oil → Vanilla Mint Shea Butter"], benefits: ["Complete morning and evening structure", "Face and body moisture", "Daily UV protection"], bestFor: "Customers building a complete routine" }
];

export const faqGroups = [
  { title: "General questions", items: [
    ["What is Shea Wellness?", "Shea Wellness is a Kenyan holistic wellness brand making natural, plant-based skin, face, hair and wellness products with sustainably sourced African ingredients."],
    ["What makes Shea Wellness different?", "Our range centres naturally derived ingredients, cold-pressed oils and botanical extracts, responsible sourcing, Kenyan manufacturing and practical everyday routines."],
    ["Are the products suitable for men, women and children?", "Most are suitable for the whole family, but essential oils, sunscreen and other products may have specific age or use directions. Always read the individual label."],
    ["Are the products cruelty-free?", "Yes. Shea Wellness does not test its finished products on animals."],
    ["Are the products vegan?", "Many are vegan. Check the individual product ingredients or ask our team for confirmation."]
  ]},
  { title: "Products & routines", items: [
    ["What skin types can use African Liquid Black Soap?", "Most skin types can use it, including oily, combination, normal and acne-prone skin. Dry skin should follow cleansing with a suitable moisturiser."],
    ["Can I use African Liquid Black Soap every day?", "Yes, when used as directed. Reduce frequency if your skin feels dry or uncomfortable."],
    ["What does Rosehip Oil help with?", "It hydrates, supports smoother texture and healthy-looking skin, and may improve the appearance of dryness-related fine lines and post-blemish marks."],
    ["Can I use Rosehip Oil every day?", "Yes. Apply a few drops after cleansing, morning and/or evening, if it suits your skin."],
    ["What are the benefits of Baobab Oil?", "It deeply moisturises, supports softness and elasticity, and conditions dry hair and scalp."],
    ["Can I use Yellow Castor Oil on my face?", "Yes, sparingly on dry skin. It is rich and may not suit every skin type, so patch test first."],
    ["Can Castor Oil help hair growth?", "It conditions the scalp and helps reduce breakage, supporting healthier-looking hair. Scientific evidence that it directly stimulates hair growth is limited."],
    ["Why should I wear sunscreen every day?", "Daily sunscreen helps protect against UV exposure associated with sunburn, premature ageing and uneven-looking tone, including on cloudy days."],
    ["Can I wear sunscreen under makeup?", "Yes. The lightweight gel is designed to absorb quickly and sit comfortably under makeup."],
    ["How often should I reapply sunscreen?", "At least every two hours outdoors, and after swimming, heavy sweating or towel drying. Follow the product label."]
  ]},
  { title: "Choose by concern", items: [
    ["Which products are best for dry skin?", "Start with African Liquid Black Soap, Baobab Oil and Vanilla Mint Shea Butter."],
    ["Which products are best for dull skin?", "Try African Liquid Black Soap, Rosehip Oil and Cucumber Mint Sunscreen Gel SPF 20+."],
    ["Which products are best for mature skin?", "Rosehip Oil, Baobab Oil and daily sunscreen make a practical routine."],
    ["Which products are best for dry hair and scalp?", "Pair Yellow Castor Oil with Baobab Oil for conditioning and moisture."],
    ["Which products help rough hands and cracked heels?", "Layer Yellow Castor Oil and Vanilla Mint Shea Butter as an overnight routine."]
  ]},
  { title: "Sustainability, delivery & support", items: [
    ["Where do your ingredients come from?", "We use trusted suppliers with a focus on African farmers, responsible sourcing and sustainable value chains whenever possible."],
    ["Is the packaging environmentally friendly?", "We are working continually toward lower-impact, more sustainable packaging solutions."],
    ["Do you deliver across Kenya?", "Yes. Nairobi delivery typically takes 1–3 business days and other Kenyan destinations 2–5 business days."],
    ["Do you ship internationally?", "Yes, to many destinations. Cost and timing depend on the country, order and shipping method."],
    ["How can I track my order?", "Tracking details are provided after dispatch where the selected courier supports tracking."],
    ["What payment methods do you accept?", "M-PESA, bank transfers, cards where available, and the approved options shown at checkout."],
    ["Can I return a product?", "Opened personal-care products cannot normally be returned for hygiene reasons unless damaged, defective or incorrect. Contact us within 48 hours of delivery."],
    ["How do I choose the right products?", "Contact our team with your skin or hair concerns for personalised routine guidance."],
    ["Can I buy in bulk or become a stockist?", "Yes. Retailers, distributors, spas, salons, hotels and wellness centres can use our wholesale enquiry route."]
  ]}
] as const;

export const quickFaqs = [
  faqGroups[0].items[2],
  faqGroups[2].items[0],
  faqGroups[2].items[3],
  faqGroups[1].items[3],
  faqGroups[3].items[2],
  faqGroups[3].items[3],
  faqGroups[3].items[0],
  faqGroups[0].items[3],
  ["How do I build a complete skincare routine?", "Use our concern-based pairings to choose a cleanser, botanical oil, moisturiser and daily sunscreen that suit your skin."],
  ["How can I contact a skincare advisor?", "Use the contact page or WhatsApp button for personalised Shea Wellness guidance."]
] as const;

export const partnerLogos = [
  ["African Women Entrepreneurship Cooperative", "image1.png"],
  ["Mövenpick Hotels & Resorts", "image2.png"],
  ["Atua Enkop Africa Luxury Camps", "image3.png"],
  ["Shamba Café & Shop", "image4.png"],
  ["Ocean Sports Watamu Kenya", "image5.png"],
  ["African Women Entrepreneurship Program", "image6.jpeg"],
  ["Royal Tulip Canaan Nairobi", "image7.png"],
  ["Kenya Export Promotion & Branding Agency", "image8.jpeg"],
  ["WIT Kenya", "image9.jpeg"],
  ["Greenspoon", "image10.png"],
  ["Ole-Sereni", "image11.jpeg"],
  ["Leopard Point Luxury Beach Resort", "image12.jpeg"],
  ["Kilili Baharini Resort & Spa", "image13.png"],
  ["Organic Farmers Market", "image14.png"],
  ["Safari Park Hotel & Casino Nairobi", "image15.png"],
  ["Kenya Nutritionists & Dieticians Institute", "image16.png"],
  ["Hob House", "image17.png"],
  ["African Continental Free Trade Area", "image18.png"],
  ["AirKenya", "image19.png"],
  ["Ghana Export Promotion Authority", "image20.png"],
  ["NAS Servair", "image21.png"],
  ["Kenya Association of Manufacturers", "image23.jpeg"],
  ["Jacaranda Hotels Kenya", "image24.jpeg"],
  ["Leopard Beach Resort & Spa", "image25.jpeg"],
  ["The Kasa Malindi", "image26.png"],
  ["Turtle Bay", "image27.jpeg"],
  ["Almanara Luxury Boutique Hotel & Villas", "image28.png"],
  ["Billionaire Resort & Retreat Malindi", "image29.png"],
  ["Shield Pharmaceuticals Ltd.", "image30.png"]
] as const;
