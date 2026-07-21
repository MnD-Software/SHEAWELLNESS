import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  Leaf,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Users
} from "lucide-react";
import {
  sheaBlogTopics,
  sheaBrand,
  sheaCatalogueDownload,
  sheaProductCategories,
  sheaQuality,
  sheaSocialProof,
  sheaSustainability,
  sheaVideos,
  sheaWholesale,
  sheaWhyChoose
} from "@/lib/shea-content";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";
import { SheaCommerceFooter, SheaTrustGrid, SheaWhatsApp } from "@/components/storefront/SheaCommerceChrome";

type SheaPageKind = "about" | "products" | "wholesale" | "sustainability" | "blog" | "quality" | "contact" | "catalogue";

const pageMeta: Record<SheaPageKind, { eyebrow: string; title: string; body: string; image: string }> = {
  about: {
    eyebrow: "Our brand story",
    title: "Nurturing wellness. Empowering communities. Sustaining nature.",
    body: "At Shea Wellness Ltd, we believe that wellness is more than skincare—it's a way of living. Our journey began with a simple yet powerful vision: to create natural, effective, and sustainable personal care products that nourish people while creating lasting value for communities and the environment.",
    image: "/assets/sheawellness/lavender-shea-butter-lid.jpeg"
  },
  products: {
    eyebrow: "Product catalogue",
    title: "Skin care, hair care, face care, and spa essentials.",
    body: "Browse Shea Wellness routines for dry skin, sensitive skin, body glow, natural face care, hair and scalp moisture, and spa environments.",
    image: "/assets/sheawellness/face-care-routine.png"
  },
  wholesale: {
    eyebrow: "Retail partners",
    title: "Wholesale opportunities for buyers, spas, and distributors.",
    body: "Shea Wellness LTD welcomes international retailers, wellness stores, organic beauty stores, spas, and distributors.",
    image: "/assets/sheawellness/lemongrass-shea-butter-lid.jpeg"
  },
  sustainability: {
    eyebrow: "Responsible sourcing",
    title: "Community-first shea rooted in African women cooperatives.",
    body: "Our shea butter is ethically sourced from African women cooperatives, empowering communities while preserving traditional production methods.",
    image: "/assets/sheawellness/pure-raw-shea-butter.jpeg"
  },
  blog: {
    eyebrow: "Wellness journal",
    title: "Stories, lessons, routines, and cinematic product education.",
    body: "A living journal for customers and wholesale buyers who want to understand how Nilotica shea, black soap, chebe, and essential oils fit into daily wellness.",
    image: "/assets/sheawellness/vanilla-mint-shea-butter.jpeg"
  },
  quality: {
    eyebrow: "Certifications and quality",
    title: "Export-ready standards for serious retail buyers.",
    body: "Quality, manufacturing practices, safety positioning, and export compliance belong at the center of the brand experience.",
    image: "/assets/sheawellness/lavender-shea-butter-back.jpeg"
  },
  contact: {
    eyebrow: "Business enquiries welcome",
    title: "Contact Shea Wellness LTD.",
    body: "Reach the team for retail orders, wholesale enquiries, catalogue requests, spa supplies, and international distribution.",
    image: "/assets/sheawellness/grapefruit-shea-butter-front.jpeg"
  },
  catalogue: {
    eyebrow: "Download centre",
    title: "Product catalogue, social proof, and media-ready brand assets.",
    body: "A central destination for product catalogue downloads, expo proof, Instagram content, testimonials, and media mentions.",
    image: "/assets/sheawellness/lavender-shea-butter-front.jpeg"
  }
};

export function SheaContentPage({ kind }: { kind: SheaPageKind }) {
  const meta = pageMeta[kind];

  return (
    <main className="shea-page">
      <SheaGlobalHeader />
      <section className="shea-page-hero">
        <div>
          <span>{meta.eyebrow}</span>
          <h1>{meta.title}</h1>
          <p>{meta.body}</p>
          <div className="shea-hero-actions">
            <a href="/products">Shop Products</a>
            <a href="/wholesale" className="secondary">Become a Distributor</a>
          </div>
        </div>
        <figure>
          <img src={meta.image} alt="" />
          <figcaption>
            <video src={sheaVideos[0].src} controls muted loop playsInline preload="none" poster="/assets/shea-wellness-tree-logo.jpeg" />
            <span>{sheaVideos[0].tag}</span>
            <strong>Real product motion</strong>
          </figcaption>
        </figure>
      </section>

      {kind === "about" ? <AboutSections /> : null}
      {kind === "products" ? <ProductsSections /> : null}
      {kind === "wholesale" ? <WholesaleSections /> : null}
      {kind === "sustainability" ? <SustainabilitySections /> : null}
      {kind === "blog" ? <BlogSections /> : null}
      {kind === "quality" ? <QualitySections /> : null}
      {kind === "contact" ? <ContactSections /> : null}
      {kind === "catalogue" ? <CatalogueSections /> : null}

      <LivingPageSection kind={kind} />
      <SheaFooter />
    </main>
  );
}

const sheaEditorialStories = [
  {
    title: "The night routine: how lavender shea became a calm-skin staple",
    category: "Skin story",
    image: "/assets/sheawellness/lavender-shea-butter-front.jpeg",
    readTime: "6 min read",
    body: "A practical story about building an evening routine for dry, tired, or sensitive-feeling skin using a gentle cleanse, a small amount of warmed shea butter, and slow massage.",
    lesson: "Use less product than you think, apply to slightly damp skin, and give the butter time to melt before adding more."
  },
  {
    title: "From wash day to protective style: chebe, shea, and length retention",
    category: "Hair lesson",
    image: "/assets/shea-chebe-haircare.png",
    readTime: "8 min read",
    body: "A hair-care guide for customers who want moisture retention, softer ends, and a consistent weekly routine without overloading the scalp.",
    lesson: "Layer water-based moisture first, seal lightly with shea or chebe butter, then focus on ends and high-friction areas."
  },
  {
    title: "Black soap without the harsh feeling: how to cleanse with balance",
    category: "Face guide",
    image: "/assets/shea-black-soap.png",
    readTime: "5 min read",
    body: "A cleanser guide explaining how African black soap can fit into a routine when used gently, rinsed thoroughly, and followed with moisture.",
    lesson: "Start a few times weekly, avoid the eye area, and always moisturize after cleansing."
  }
];

const sheaHowToLessons = [
  {
    title: "How to use raw shea butter",
    steps: ["Scoop a pea-sized amount", "Warm between palms until glossy", "Press into damp skin", "Massage dry areas for 30 seconds", "Reapply only where needed"],
    note: "Best for elbows, knees, feet, hands, body, and dry hair ends."
  },
  {
    title: "How to use body butter infusions",
    steps: ["Apply after bathing", "Start with a thin layer", "Use circular massage", "Let it absorb before dressing", "Use nightly on rough patches"],
    note: "Lavender is ideal for a calm evening routine; citrus blends feel brighter for daytime."
  },
  {
    title: "How to use African black soap",
    steps: ["Wet skin first", "Lather in hands or cloth", "Massage gently", "Rinse completely", "Follow with shea moisture"],
    note: "Avoid over-cleansing. Skin should feel clean, not stripped."
  },
  {
    title: "How to use essential oils safely",
    steps: ["Diffuse for aroma", "Dilute before topical use", "Patch test first", "Avoid eyes and broken skin", "Store away from heat"],
    note: "Essential oils are concentrated; a few drops go a long way."
  }
];

const sheaRoutineSolutions = [
  {
    title: "Dry and flaky skin solution",
    body: "African Liquid Black Soap, Vanilla-Mint Shea Butter, and Soothing Body Oil help cleanse gently, replenish moisture, and seal hydration.",
    steps: ["Cleanse with lukewarm water", "Apply butter while skin is damp", "Finish with body oil on rough patches"]
  },
  {
    title: "Sensitive skin solution",
    body: "A careful routine with African Liquid Black Soap, Lavender Shea Butter, and optional body oil after a patch test.",
    steps: ["Avoid hot water and scrubbing", "Moisturize immediately after bathing", "Patch test products with essential oils"]
  },
  {
    title: "Natural face care routine",
    body: "A three-step morning and evening system for clean, hydrated, protected, and restored skin.",
    steps: ["Cleanse with black soap", "Nourish with Rosehip Facial Oil", "Protect by day and restore with Lavender Shea Butter at night"]
  },
  {
    title: "Fresh body glow solution",
    body: "African Liquid Black Soap, Grapefruit Shea Butter, and Soothing Body Oil support softer, smoother, naturally radiant skin.",
    steps: ["Refresh and purify", "Brighten and nourish", "Seal in radiance"]
  },
  {
    title: "Hair and scalp moisture solution",
    body: "Black soap cleansing, Cold Pressed Yellow Castor Oil, and diluted Rosemary Essential Oil support a clean, moisturized scalp.",
    steps: ["Cleanse scalp on wash day", "Seal hair moisture with castor oil", "Use diluted rosemary for scalp massage"]
  },
  {
    title: "SPA essentials collection",
    body: "Essential oils, aroma diffusers, humidifiers, and spa supplies help homes, offices, salons, hotels, and wellness spaces feel calm and restored.",
    steps: ["Diffuse oils for atmosphere", "Use humidifiers for comfort", "Request spa supplies for treatment rooms"]
  }
];

const pageLifeCopy: Record<SheaPageKind, { title: string; body: string; image: string }> = {
  about: {
    title: "A brand built from African wellness heritage.",
    body: "Every page connects back to the same promise: clean ingredients, ethical sourcing, and products customers can understand before they buy.",
    image: "/assets/sheawellness/grapefruit-shea-butter-lid.jpeg"
  },
  products: {
    title: "See the texture, understand the routine, then choose the product.",
    body: "The product experience combines real product media, ingredient clarity, and practical usage guidance.",
    image: "/assets/sheawellness/lavender-shea-butter-back.jpeg"
  },
  wholesale: {
    title: "Retail-ready storytelling for buyers and distributors.",
    body: "Wholesale clients need confidence in quality, range depth, packaging, and brand story before requesting supply.",
    image: "/assets/sheawellness/lemongrass-shea-butter-front.jpeg"
  },
  sustainability: {
    title: "Responsible sourcing should be visible, not hidden.",
    body: "Sustainability is treated as part of the shopping experience, from sourcing to packaging to community impact.",
    image: "/assets/sheawellness/pure-raw-shea-butter.jpeg"
  },
  blog: {
    title: "Education turns products into routines.",
    body: "The journal gives customers reasons to return: stories, seasonal routines, usage lessons, ingredient explainers, and product videos.",
    image: "/assets/sheawellness/vanilla-mint-shea-butter.jpeg"
  },
  quality: {
    title: "Quality content gives buyers confidence.",
    body: "This page can hold certification proof, quality standards, export documents, and ingredient transparency.",
    image: "/assets/sheawellness/lavender-shea-butter-back.jpeg"
  },
  contact: {
    title: "Make every enquiry feel guided.",
    body: "Retail, wholesale, spa, media, and distributor conversations all need clear next steps.",
    image: "/assets/sheawellness/grapefruit-shea-butter-front.jpeg"
  },
  catalogue: {
    title: "The media catalogue should feel like a premium brand room.",
    body: "Buyers can inspect product films, social proof, expo proof, testimonials, and downloadable catalogue material.",
    image: "/assets/sheawellness/lavender-shea-butter-front.jpeg"
  }
};

function PromiseGrid() {
  return (
    <section className="shea-band-grid">
      {sheaBrand.promises.map((promise) => (
        <article key={promise}>
          <CheckCircle2 size={22} />
          <strong>{promise}</strong>
        </article>
      ))}
    </section>
  );
}

function AboutSections() {
  return (
    <>
      <PromiseGrid />
      <section className="shea-split-section">
        <div>
          <span>Our story</span>
          <h2>Nurturing Wellness. Empowering Communities. Sustaining Nature.</h2>
          <p>
            Inspired by Africa&apos;s rich botanical heritage, we harness the remarkable benefits of premium
            shea butter, cold-pressed plant oils, and carefully selected essential oils to craft products
            that care for the skin, hair, and overall wellbeing of the whole family. Every product we make
            reflects our commitment to purity, quality, and intentional craftsmanship.
          </p>
        </div>
        <div className="shea-card-grid two">
          {sheaBrand.standards.map((standard) => (
            <article key={standard}><Leaf size={20} /><strong>{standard}</strong></article>
          ))}
        </div>
      </section>
      <section className="shea-card-grid three">
        <StoryCard title="More than skincare" body="Shea Wellness connects sustainable sourcing, local manufacturing, innovation, and community empowerment." />
        <StoryCard title="Made in Kenya" body="By manufacturing locally and sourcing high-quality natural ingredients, the brand shows that African businesses can produce world-class wellness products." />
        <StoryCard title="Future vision" body="Growth means more jobs, stronger manufacturing, empowered entrepreneurs, and Shea Wellness products in homes, hotels, spas, retail stores, and international markets." />
      </section>
      <section className="shea-section">
        <SectionTitle label="Our values" title="Sustainability, ethical sourcing, natural wellness, and African heritage." />
        <div className="shea-card-grid four">
          {["Sustainability", "Ethical sourcing", "Natural wellness", "African heritage"].map((item) => (
            <article key={item}><Sparkles size={20} /><strong>{item}</strong></article>
          ))}
        </div>
      </section>
    </>
  );
}

function ProductsSections() {
  return (
    <>
      <VideoShowcase title="Product videos shoppers can actually see" body="Use these films for product inspection, social proof, and retail buyer confidence." />
      <section className="shea-section">
        <SectionTitle label="Routine solutions" title="Choose the routine that matches the customer's care need." />
        <div className="shea-card-grid three">
          {sheaRoutineSolutions.map((solution) => (
            <article key={solution.title}>
              <Sparkles size={20} />
              <strong>{solution.title}</strong>
              <p>{solution.body}</p>
              <ol>
                {solution.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </article>
          ))}
        </div>
      </section>
      <section className="shea-section">
        <SectionTitle label="Our products" title="Every category from the content structure is represented." />
        <div className="shea-product-category-stack">
          {sheaProductCategories.map((category) => (
            <section className="shea-product-category" key={category.name}>
              <div className="shea-product-category-head">
                <span>{category.name}</span>
                <p>{category.summary}</p>
              </div>
              <div className="shea-product-list">
                {category.products.map((product) => (
                  <article className="shea-product-detail-card" key={product.name}>
                    <img src={product.image} alt={product.name} />
                    <div>
                      <strong>{product.name}</strong>
                      <p>{product.description}</p>
                      <ProductFact label="Key ingredients" items={product.ingredients} />
                      <ProductFact label="Benefits" items={product.benefits} />
                      <ProductFact label="Size options" items={product.sizes} />
                      <small>{product.usage}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}

function WholesaleSections() {
  return (
    <>
      <section className="shea-split-section">
        <div>
          <span>Wholesale opportunities</span>
          <h2>Built for international buyers and professional wellness channels.</h2>
          <p>Shea Wellness LTD partners with international retailers, wellness spas, organic beauty stores, and distributors.</p>
        </div>
        <div className="shea-card-grid two">
          {sheaWholesale.partners.map((partner) => (
            <article key={partner}><Store size={20} /><strong>{partner}</strong></article>
          ))}
        </div>
      </section>
      <section className="shea-section">
        <SectionTitle label="Why retailers choose us" title="Premium African ingredients with export-ready business support." />
        <div className="shea-card-grid four">
          {sheaWholesale.reasons.map((reason) => (
            <article key={reason}><Truck size={20} /><strong>{reason}</strong></article>
          ))}
        </div>
        <div className="shea-cta-panel">
          <h2>{sheaWholesale.cta}</h2>
          <p>Use the contact form or email Shea Wellness to request the wholesale catalogue, private label options, and distributor pricing.</p>
          <a href="/contact">Request Wholesale Catalogue <ArrowRight size={18} /></a>
        </div>
      </section>
    </>
  );
}

function SustainabilitySections() {
  return (
    <>
      <section className="shea-split-section">
        <div>
          <span>Sustainability</span>
          <h2>Ethically sourced Nilotica shea that supports communities.</h2>
          <p>
            Our shea butter is ethically sourced from African women cooperatives, empowering communities while
            preserving traditional production methods.
          </p>
        </div>
        <div className="shea-card-grid two">
          {sheaSustainability.map((item) => (
            <article key={item}><Leaf size={20} /><strong>{item}</strong></article>
          ))}
        </div>
      </section>
      <WhyChooseSection />
    </>
  );
}

function BlogSections() {
  return (
    <>
      <section className="shea-blog-editorial">
        <article className="shea-blog-feature">
          <video src={sheaVideos[2].src} controls muted loop playsInline preload="none" poster="/assets/shea-wellness-tree-logo.jpeg" />
          <div>
            <span>Cinematic feature</span>
            <h2>The Shea Wellness routine: cleanse, nourish, seal, and glow.</h2>
            <p>
              Follow the product from jar to skin: a gentle cleanse, a small amount of warmed shea, slow massage,
              and a finish that feels intentional rather than heavy. This guide helps customers understand how to use
              the products correctly before they buy.
            </p>
            <a href="#how-to-use">Start the lesson <ArrowRight size={18} /></a>
          </div>
        </article>
        <aside>
          <span>Journal paths</span>
          {sheaEditorialStories.map((story, index) => (
            <article key={story.title}>
              <small>0{index + 1}</small>
              <strong>{story.title}</strong>
              <p>{story.body}</p>
            </article>
          ))}
        </aside>
      </section>

      <section className="shea-story-deck">
        <div className="shea-section-title">
          <span>Wellness stories</span>
          <h2>Editorial stories with product lessons inside.</h2>
        </div>
        <div className="shea-story-grid">
          {sheaEditorialStories.map((story) => (
            <article key={story.title}>
              <img src={story.image} alt="" />
              <div>
                <span>{story.category} - {story.readTime}</span>
                <strong>{story.title}</strong>
                <p>{story.body}</p>
                <small>{story.lesson}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <VideoShowcase title="Video-led lessons for skin, hair, and product texture" body="Cinematic product films make the education feel tangible: customers see texture, packaging, and application context instead of reading flat instructions." />

      <section className="shea-howto-section" id="how-to-use">
        <div>
          <span>How to use</span>
          <h2>Practical lessons customers can follow at home.</h2>
          <p>Each lesson is written like a skincare card: short enough to use, specific enough to build confidence, and clear enough for first-time customers.</p>
        </div>
        <div className="shea-howto-grid">
          {sheaHowToLessons.map((lesson, index) => (
            <article key={lesson.title}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{lesson.title}</strong>
              <ol>
                {lesson.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <p>{lesson.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shea-section">
        <SectionTitle label="Latest articles" title="In-depth articles for customers, salons, and wholesale buyers." />
        <div className="shea-blog-grid">
          {sheaBlogTopics.map((topic, index) => (
            <article key={topic}>
              <img
                src={[
                  "/assets/sheawellness/pure-raw-shea-butter.jpeg",
                  "/assets/shea-chebe-haircare.png",
                  "/assets/shea-essential-oils.png",
                  "/assets/sheawellness/grapefruit-shea-butter-front.jpeg"
                ][index]}
                alt=""
              />
              <div>
                <span>{index === 0 ? "Skin" : index === 1 ? "Hair" : index === 2 ? "Aroma" : "Routine"}</span>
                <strong>{topic}</strong>
                <p>
                  {[
                    "A deep guide to moisture, barrier comfort, body care, and choosing the right shea butter texture.",
                    "A practical wash-day and protective-style lesson for chebe, shea butter, and length retention.",
                    "A safety-first aromatherapy lesson covering dilution, diffusers, storage, and scent pairings.",
                    "A morning-to-night organic routine with cleanser, butter, oil, and weekly reset steps."
                  ][index]}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function LivingPageSection({ kind }: { kind: SheaPageKind }) {
  const copy = pageLifeCopy[kind];

  return (
    <section className="shea-living-section">
      <figure>
        <img src={copy.image} alt="" loading="lazy" />
        <figcaption>
          <video src={sheaVideos[1].src} controls muted loop playsInline preload="none" poster="/assets/shea-wellness-tree-logo.jpeg" />
        </figcaption>
      </figure>
      <div>
        <span>Shea Wellness experience</span>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        <div>
          <article><CheckCircle2 size={18} /><strong>Product media</strong><small>Real jars, textures, and product films.</small></article>
          <article><BookOpen size={18} /><strong>Education</strong><small>Usage lessons that make routines clear.</small></article>
          <article><Sparkles size={18} /><strong>Premium trust</strong><small>Clean claims, sourcing proof, and buyer confidence.</small></article>
        </div>
      </div>
    </section>
  );
}

function QualitySections() {
  return (
    <>
      <section className="shea-split-section">
        <div>
          <span>Certifications and quality</span>
          <h2>Quality standards, manufacturing practices, and export confidence.</h2>
          <p>
            This page is structured for export buyers and can be updated with certification documents when available.
          </p>
        </div>
        <div className="shea-card-grid two">
          {sheaQuality.map((item) => (
            <article key={item}><ShieldCheck size={20} /><strong>{item}</strong></article>
          ))}
        </div>
      </section>
      <section className="shea-cta-panel">
        <h2>Certification document area</h2>
        <p>Quality certificates, lab documents, organic ingredient statements, and export compliance files can be added here for buyer review.</p>
      </section>
    </>
  );
}

function ContactSections() {
  return (
    <section className="shea-contact-grid">
      <div className="shea-contact-card">
        <Mail size={22} />
        <span>Email</span>
        <strong>{sheaBrand.email}</strong>
      </div>
      <div className="shea-contact-card">
        <Phone size={22} />
        <span>Phone</span>
        <strong>{sheaBrand.phone}</strong>
      </div>
      <div className="shea-contact-card">
        <MapPin size={22} />
        <span>Business address</span>
        <strong>{sheaBrand.address}</strong>
      </div>
      <form className="shea-contact-form">
        <span>Contact form</span>
        <h2>Business enquiries welcome</h2>
        <label>Name<input placeholder="Your name" /></label>
        <label>Email<input placeholder="you@example.com" type="email" /></label>
        <label>Enquiry type<select defaultValue="Wholesale"><option>Wholesale</option><option>Retail order</option><option>Spa essentials</option><option>Media</option></select></label>
        <label>Message<textarea placeholder="Tell Shea Wellness what you need" /></label>
        <button type="button">Send enquiry</button>
      </form>
    </section>
  );
}

function CatalogueSections() {
  return (
    <>
      <section className="shea-cta-panel catalogue">
        <Download size={28} />
        <h2>{sheaCatalogueDownload.title}</h2>
        <p>{sheaCatalogueDownload.body}</p>
        <a href="/contact">{sheaCatalogueDownload.cta}</a>
      </section>
      <section className="shea-section">
        <SectionTitle label="Social proof" title="Instagram, testimonials, expo participation, and media mentions." />
        <div className="shea-card-grid four">
          {sheaSocialProof.map((item) => (
            <article key={item.title}><Award size={20} /><strong>{item.title}</strong><p>{item.body}</p></article>
          ))}
        </div>
      </section>
      <section className="shea-section">
        <SectionTitle label="Video media" title="Product videos ready for campaigns and social proof." />
        <div className="shea-video-slider">
          {sheaVideos.map((video) => (
            <article key={video.src}>
              <video src={video.src} controls muted loop playsInline preload="none" poster="/assets/shea-wellness-tree-logo.jpeg" />
              <strong>{video.title}</strong>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function VideoShowcase({ title, body }: { title: string; body: string }) {
  return (
    <section className="shea-video-showcase">
      <div>
        <span>Product motion</span>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <div className="shea-video-slider featured">
        {sheaVideos.slice(0, 3).map((video) => (
          <article key={video.src}>
            <video src={video.src} controls muted loop playsInline preload="none" poster="/assets/shea-wellness-tree-logo.jpeg" />
            <strong>{video.title}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhyChooseSection() {
  return (
    <section className="shea-section">
      <SectionTitle label="Why choose Shea Wellness" title="Eco-friendly, holistic, authentic, and premium." />
      <div className="shea-card-grid four">
        {sheaWhyChoose.map((item) => (
          <article key={item.title}><Users size={20} /><strong>{item.title}</strong><p>{item.body}</p></article>
        ))}
      </div>
    </section>
  );
}

function ProductFact({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="shea-product-fact">
      <span>{label}</span>
      <p>{items.join(" | ")}</p>
    </div>
  );
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <div className="shea-section-title">
      <span>{label}</span>
      <h2>{title}</h2>
    </div>
  );
}

function StoryCard({ title, body }: { title: string; body: string }) {
  return <article><Sparkles size={20} /><strong>{title}</strong><p>{body}</p></article>;
}

function SheaFooter() {
  return <><SheaTrustGrid /><SheaCommerceFooter /><SheaWhatsApp /></>;
}
