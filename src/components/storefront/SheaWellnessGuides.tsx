import { CheckCircle2, Droplets, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";
import { SheaCommerceFooter, SheaTrustGrid, SheaWhatsApp } from "@/components/storefront/SheaCommerceChrome";

type ProductStep = {
  name: string;
  image: string;
  role: string;
  benefits: string[];
  usage: string[];
  caution?: string;
};

type Guide = {
  id: string;
  title: string;
  intro: string;
  image: string;
  products: ProductStep[];
  morning: string[];
  evening: string[];
  lifestyle?: string[];
  results: string[];
};

const guides: Guide[] = [
  {
    id: "dry-flaky-skin",
    title: "Dry & flaky skin solution",
    intro: "A gentle cleanse, intensive moisture, and a sealing oil work together to replenish lost moisture, support the skin barrier, and soften rough, tight, itchy, or flaky skin.",
    image: "/assets/sheawellness/vanilla-mint-shea-butter.jpeg",
    products: [
      {
        name: "African Liquid Black Soap",
        image: "/assets/WhatsApp Image 2026-07-08 at 12.44.27 (3).jpeg",
        role: "Gentle daily cleanser",
        benefits: ["Removes dirt, sweat, and impurities", "Helps maintain moisture balance", "Leaves skin ready to absorb moisture", "Suitable for daily face and body cleansing"],
        usage: ["Apply to wet skin and massage gently", "Rinse with lukewarm water", "Avoid very hot water", "Moisturize immediately while skin is slightly damp"],
        caution: "Black soap can feel drying on very dry skin when used too frequently or without moisturizer. Adjust use to your skin's response."
      },
      {
        name: "Vanilla-Mint Shea Butter",
        image: "/assets/sheawellness/vanilla-mint-shea-butter.jpeg",
        role: "Intensive daily moisturizer",
        benefits: ["Deeply moisturizes and softens", "Supports the natural moisture barrier", "Reduces roughness and flaking", "Supports elasticity", "Leaves a refreshing vanilla-mint finish"],
        usage: ["Apply generously morning and evening", "Focus on elbows, knees, heels, hands, and rough patches", "For best results, apply immediately after bathing"]
      },
      {
        name: "Soothing Body Oil",
        image: "/assets/WhatsApp Image 2026-07-08 at 12.44.26 (1).jpeg",
        role: "Moisture-sealing body oil",
        benefits: ["Locks in hydration", "Softens rough skin", "Supports a healthy-looking glow", "Leaves skin silky smooth", "Peppermint gives a refreshing massage experience"],
        usage: ["Massage a few drops over slightly damp skin", "Layer after Vanilla-Mint Shea Butter", "Focus on especially dry areas"],
        caution: "The castor-oil-rich blend can feel heavy for some skin types; begin with a small amount."
      }
    ],
    morning: ["Cleanse gently with African Liquid Black Soap", "Pat dry, leaving skin slightly damp", "Apply Vanilla-Mint Shea Butter", "Finish with a few drops of Soothing Body Oil"],
    evening: ["Cleanse gently", "Apply Vanilla-Mint Shea Butter", "Massage Soothing Body Oil over dry areas", "Leave the moisture layers to work overnight"],
    results: ["Softer, smoother-feeling skin", "Better day-long hydration", "Less visible flaking and roughness", "Reduced feelings of tightness", "A healthier-looking natural glow"]
  },
  {
    id: "sensitive-skin",
    title: "Sensitive skin solution",
    intro: "Gentle, intentional care for skin that reacts to weather, harsh cleansers, fragrance, or environmental stress. The routine prioritizes mild cleansing, barrier-supporting moisture, and careful patch testing.",
    image: "/assets/sheawellness/lavender-shea-butter-front.jpeg",
    products: [
      {
        name: "African Liquid Black Soap",
        image: "/assets/WhatsApp Image 2026-07-08 at 12.44.27 (3).jpeg",
        role: "Gentle cleansing without stripping",
        benefits: ["Cleanses without a tight, dry feeling", "Removes dirt, excess oil, and impurities", "Helps maintain moisture balance", "Suitable for daily face and body use"],
        usage: ["Wet skin with lukewarm water", "Massage a small amount gently", "Rinse thoroughly and pat dry", "Follow immediately with moisturizer"],
        caution: "Avoid hot water, vigorous scrubbing, and over-cleansing."
      },
      {
        name: "Lavender Shea Butter",
        image: "/assets/sheawellness/lavender-shea-butter-front.jpeg",
        role: "Calming daily moisturizer",
        benefits: ["Deeply moisturizes dry, sensitive skin", "Supports the protective barrier", "Softens delicate or rough skin", "Helps relieve dryness-related tightness", "Leaves skin smooth and comfortable"],
        usage: ["Apply morning and evening after cleansing", "Use while skin is slightly damp", "Pay attention to hands, elbows, knees, and dry patches", "Use on the face only if suitable for your skin"]
      },
      {
        name: "Soothing Body Oil",
        image: "/assets/WhatsApp Image 2026-07-08 at 12.44.26 (1).jpeg",
        role: "Optional nourishment and protection",
        benefits: ["Helps seal in hydration", "Softens dry, delicate skin", "Supports a radiant appearance", "Leaves skin silky smooth"],
        usage: ["Patch test first", "If tolerated, massage a small amount over damp skin after shea butter"],
        caution: "Contains peppermint and orange peel essential oils. Very sensitive or reactive skin should patch test first, omit the oil if irritation occurs, and seek professional advice when needed."
      }
    ],
    morning: ["Cleanse gently", "Pat dry without rubbing", "Apply Lavender Shea Butter", "If tolerated, add a few drops of Soothing Body Oil"],
    evening: ["Cleanse with lukewarm water", "Moisturize with Lavender Shea Butter", "Use body oil only when well tolerated"],
    lifestyle: ["Drink enough water", "Use lukewarm rather than hot bath water", "Moisturize immediately after bathing", "Choose soft, breathable fabrics", "Wear broad-spectrum sunscreen and protective clothing", "Patch-test every new product"],
    results: ["Better hydration", "Softer, smoother-feeling skin", "Greater comfort", "Better support for the skin barrier", "A calm, healthy-looking glow"]
  },
  {
    id: "face-care",
    title: "Natural face care routine",
    intro: "A simple morning-and-evening routine designed to cleanse gently, replenish moisture, support the natural barrier, and maintain a healthy-looking complexion.",
    image: "/assets/WhatsApp Image 2026-07-08 at 12.44.27 (3).jpeg",
    products: [
      { name: "African Liquid Black Soap", image: "/assets/WhatsApp Image 2026-07-08 at 12.44.27 (3).jpeg", role: "Gentle daily face cleanser", benefits: ["Removes dirt, excess oil, sunscreen, and impurities", "Maintains moisture balance", "Leaves skin fresh and soft", "Prepares skin for oils and moisturizers"], usage: ["Wet with lukewarm water", "Massage gently in circular motions", "Avoid vigorous scrubbing", "Rinse thoroughly and pat dry"] },
      { name: "Rosehip Facial Oil", image: "/assets/WhatsApp Image 2026-07-08 at 12.44.27 (3).jpeg", role: "Nourishing skin moisture", benefits: ["Hydrates without a heavy finish", "Softens and smooths", "Supports the moisture barrier", "Promotes a healthy-looking glow"], usage: ["Apply 2-4 drops to slightly damp skin", "Press and massage into face and neck", "Allow to absorb before sunscreen or makeup"] },
      { name: "Lavender Shea Butter", image: "/assets/sheawellness/lavender-shea-butter-front.jpeg", role: "Overnight moisture barrier", benefits: ["Nourishes dry areas", "Helps prevent overnight moisture loss", "Softens rough patches", "Relieves dryness-related tightness"], usage: ["Warm a very small amount between fingertips", "Press onto dry areas as the final evening step", "Use sparingly on oily or combination skin"] }
    ],
    morning: ["Cleanse with African Liquid Black Soap", "Apply 2-4 drops of Rosehip Facial Oil", "Finish with broad-spectrum SPF 30 or higher"],
    evening: ["Cleanse gently", "Massage Rosehip Facial Oil into clean skin", "Seal dry areas with a light layer of Lavender Shea Butter"],
    lifestyle: ["Follow the routine consistently", "Stay hydrated and eat a balanced diet", "Wear sunscreen daily, including on cloudy days", "Patch test first if your skin is sensitive"],
    results: ["Cleaner, refreshed skin", "Better hydration", "Softer texture", "A more supple, comfortable feel", "A naturally radiant appearance"]
  },
  {
    id: "body-glow",
    title: "Fresh body glow solution",
    intro: "A cleanse-moisturize-seal routine for skin that looks dull after sun, pollution, dry weather, or everyday exposure.",
    image: "/assets/sheawellness/grapefruit-shea-butter-front.jpeg",
    products: [
      { name: "African Liquid Black Soap", image: "/assets/WhatsApp Image 2026-07-08 at 12.44.27 (3).jpeg", role: "Refresh and purify", benefits: ["Cleanses without stripping", "Removes dulling impurities", "Leaves skin fresh and revitalized", "Prepares skin for moisturizer"], usage: ["Massage onto wet skin", "Rinse with lukewarm water", "Pat dry but leave skin slightly damp"] },
      { name: "Grapefruit Shea Butter", image: "/assets/sheawellness/grapefruit-shea-butter-front.jpeg", role: "Brighten and nourish", benefits: ["Deeply moisturizes", "Supports the moisture barrier", "Softens and smooths", "Promotes a fresh, healthy-looking glow", "Offers an uplifting citrus aroma"], usage: ["Massage generously over damp skin after bathing", "Focus on arms, legs, hands, elbows, knees, and feet"] },
      { name: "Soothing Body Oil", image: "/assets/WhatsApp Image 2026-07-08 at 12.44.26 (1).jpeg", role: "Seal in radiance", benefits: ["Locks in hydration", "Leaves skin silky and soft", "Enhances natural-looking glow", "Gives a healthy-looking sheen without a greasy feel"], usage: ["Massage a few drops over the body after Grapefruit Shea Butter", "Allow the oil to absorb naturally"] }
    ],
    morning: ["Cleanse", "Moisturize with Grapefruit Shea Butter", "Finish with Soothing Body Oil"],
    evening: ["Cleanse", "Replenish moisture with Grapefruit Shea Butter", "Apply oil to dry areas for overnight nourishment"],
    lifestyle: ["Drink water throughout the day", "Eat colorful fruits and vegetables", "Get enough sleep", "Exercise regularly", "Exfoliate gently once or twice weekly", "Use sunscreen and protective clothing"],
    results: ["Softer and smoother skin", "Better hydration", "A fresh, revitalized feel", "Greater suppleness", "A naturally radiant appearance"]
  },
  {
    id: "hair-scalp",
    title: "Hair & scalp moisture solution",
    intro: "A flexible routine for natural, relaxed, braided, loc'd, colour-treated, or covered hair that focuses on a clean scalp, moisture retention, softness, and manageability.",
    image: "/assets/sheawellness/pure-raw-shea-butter.jpeg",
    products: [
      { name: "African Liquid Black Soap", image: "/assets/WhatsApp Image 2026-07-08 at 12.44.25.jpeg", role: "Gentle hair and scalp cleanser", benefits: ["Removes sweat, excess oil, and buildup", "Helps maintain scalp moisture balance", "Leaves the scalp fresh", "Prepares hair for nourishing oils"], usage: ["Wet hair thoroughly", "Lather in hands or apply carefully to the scalp", "Massage with fingertips", "Work through lengths and rinse thoroughly"] },
      { name: "Cold Pressed Yellow Castor Oil", image: "/assets/WhatsApp Image 2026-07-08 at 12.44.26.jpeg", role: "Deep moisture and scalp nourishment", benefits: ["Moisturizes a dry scalp", "Softens brittle hair", "Helps reduce the appearance of a flaky scalp", "Seals in moisture", "Improves manageability and shine"], usage: ["Warm a small amount between palms", "Massage into scalp and smooth through ends", "For an overnight treatment, cover with a satin bonnet", "Apply to exposed scalp between wash days"] },
      { name: "Rosemary Essential Oil", image: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg", role: "Diluted scalp-care boost", benefits: ["Refreshes the scalp", "Supports a clean scalp environment", "Complements regular hair care", "Adds a herbal aroma"], usage: ["Mix 2-3 drops with one tablespoon of castor oil", "Massage into the scalp for 3-5 minutes", "Leave on before styling or overnight if comfortable"], caution: "Never apply essential oil undiluted. Stop use if irritation occurs." }
    ],
    morning: ["Between wash days, apply a small amount of castor oil as needed", "Focus on dry ends", "Massage gently for even distribution"],
    evening: ["On wash day, cleanse scalp and hair", "Seal moisture with castor oil", "Use only a diluted rosemary blend for scalp massage"],
    lifestyle: ["Eat a balanced diet with protein, iron, zinc, and vitamins", "Limit excessive heat styling", "Use a satin bonnet or pillowcase", "Massage rather than scratch the scalp", "Trim split ends regularly"],
    results: ["Better moisturized hair and scalp", "Softer, more manageable hair", "Less dryness-related discomfort", "Healthier-looking shine", "A cleaner-feeling scalp environment"]
  },
  {
    id: "spa-essentials",
    title: "SPA essentials collection",
    intro: "Essential oils, aroma diffusers, and humidifiers help create calm, refreshing wellness spaces at home, work, salons, spas, hotels, and studios.",
    image: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg",
    products: [
      { name: "Shea Wellness Essential Oils", image: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg", role: "Nature-inspired aromatherapy", benefits: ["Creates an inviting atmosphere", "Freshens indoor spaces", "Complements massage when properly diluted", "Supports meditation, prayer, yoga, and mindfulness"], usage: ["Choose lemongrass, lavender, peppermint, eucalyptus, sweet orange, or rosemary", "Diffuse according to appliance instructions", "Dilute correctly before any topical use"], caution: "Keep essential oils away from children and pets and follow the individual oil's instructions." },
      { name: "Aroma Diffusers", image: "/assets/WhatsApp Image 2026-07-08 at 12.44.24.jpeg", role: "Natural fragrance for your space", benefits: ["Disperses essential oils through a room", "Creates a calm ambience", "Refreshes stale-smelling spaces", "Adds a decorative wellness touch"], usage: ["Fill with clean water", "Add 3-8 drops of essential oil", "Switch on and enjoy", "Clean according to manufacturer instructions"] },
      { name: "Humidifiers", image: "/assets/WhatsApp Image 2026-07-08 at 12.44.24 (1).jpeg", role: "Indoor comfort", benefits: ["Adds moisture to dry indoor air", "Improves comfort during dry weather or air conditioning", "Supports a pleasant work, rest, or sleep environment"], usage: ["Fill with clean water", "Adjust mist level", "Clean regularly"], caution: "Only add essential oils if the specific humidifier model is designed for aromatherapy." }
    ],
    morning: ["Diffuse sweet orange or lemongrass for a bright start", "Use a humidifier where indoor air feels dry"],
    evening: ["Diffuse lavender for a calm wind-down", "Pair aroma with skincare, reading, prayer, meditation, or self-care"],
    lifestyle: ["Ideal for homes and bedrooms", "Useful in offices and reception areas", "Suitable for salons, barber shops, spas, hotels, and wellness centres", "A thoughtful addition to gift hampers and wellness packages"],
    results: ["A calmer atmosphere", "Naturally refreshed indoor fragrance", "More comfortable-feeling indoor air", "A more intentional everyday wellness routine"]
  }
];

export function SheaWellnessGuides() {
  return (
    <main className="shea-page guide-page">
      <SheaGlobalHeader />
      <section className="guide-hero">
        <span>Care inspired by nature</span>
        <h1>Find the Shea Wellness routine for you.</h1>
        <p>Six practical guides covering dry skin, sensitive skin, face care, body glow, hair and scalp moisture, and restorative spaces.</p>
        <nav aria-label="Wellness guide contents">
          {guides.map((guide) => <a href={`#${guide.id}`} key={guide.id}>{guide.title}</a>)}
        </nav>
      </section>

      {guides.map((guide, index) => (
        <article className="wellness-guide" id={guide.id} key={guide.id}>
          <header>
            <div><span>Guide {String(index + 1).padStart(2, "0")}</span><h2>{guide.title}</h2><p>{guide.intro}</p></div>
            <img src={guide.image} alt={`Shea Wellness ${guide.title}`} />
          </header>
          <div className="guide-products">
            {guide.products.map((product, productIndex) => (
              <section key={product.name}>
                <img className="guide-product-image" src={product.image} alt={`Shea Wellness ${product.name}`} />
                <span>Step {productIndex + 1}</span>
                <h3>{product.name}</h3>
                <strong>{product.role}</strong>
                <div className="guide-facts">
                  <div><h4><Sparkles size={17} /> Benefits</h4><ul>{product.benefits.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><h4><Droplets size={17} /> How to use</h4><ol>{product.usage.map((item) => <li key={item}>{item}</li>)}</ol></div>
                </div>
                {product.caution ? <p className="guide-caution"><ShieldCheck size={18} /> {product.caution}</p> : null}
              </section>
            ))}
          </div>
          <div className="guide-routine-grid">
            <section><span>Morning / daytime</span><ol>{guide.morning.map((item) => <li key={item}>{item}</li>)}</ol></section>
            <section><span>Evening / treatment</span><ol>{guide.evening.map((item) => <li key={item}>{item}</li>)}</ol></section>
            {guide.lifestyle ? <section><span>Wellness tips</span><ul>{guide.lifestyle.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
            <section><span>With consistent use</span><ul>{guide.results.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul></section>
          </div>
        </article>
      ))}

      <section className="guide-disclaimer">
        <Leaf size={24} />
        <div><h2>Gentle care, informed choices.</h2><p>Cosmetic results vary. Patch test new products, discontinue use if irritation occurs, and consult a qualified healthcare professional for persistent, severe, or diagnosed skin and scalp conditions. These guides do not replace medical advice.</p></div>
      </section>
      <SheaTrustGrid /><SheaCommerceFooter /><SheaWhatsApp />
    </main>
  );
}
