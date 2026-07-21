"use client";

import { ArrowRight, CheckCircle2, Leaf, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";
import { platformSnapshot } from "@/lib/platform-data";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export type DepartmentKind = "face" | "skin" | "hair" | "gifts" | "spa";

const departmentContent: Record<DepartmentKind, {
  eyebrow: string; title: string; intro: string; hero: string; categories: string[];
  promise: string; routines: Array<{ title: string; copy: string }>; benefits: string[];
}> = {
  face: {
    eyebrow: "Face care collection", title: "Cleanse gently. Nourish deeply. Glow naturally.",
    intro: "A complete botanical face routine built around African Liquid Black Soap, Rosehip Facial Oil, overnight shea moisture, and daily sun protection.",
    hero: "/assets/sheawellness/face-care-routine-hero.png", categories: ["Face Care"],
    promise: "Simple morning and evening care for clean, hydrated, comfortable skin.",
    routines: [{ title: "Morning", copy: "Cleanse, apply 2-4 drops of facial oil, then finish with broad-spectrum sunscreen." }, { title: "Evening", copy: "Cleanse, nourish with facial oil, and seal dry areas with a small amount of Lavender Shea Butter." }],
    benefits: ["Gentle daily cleansing", "Moisture-barrier support", "Soft, healthy-looking glow"]
  },
  skin: {
    eyebrow: "Skin and body care", title: "Comfort for dry, sensitive, and glow-seeking skin.",
    intro: "Pure shea butter and botanical infusions designed for dry patches, sensitive-feeling skin, body moisture, massage, and everyday radiance.",
    hero: "/assets/sheawellness/vanilla-mint-shea-butter.jpeg", categories: ["Body Care"],
    promise: "Choose a butter by concern, texture, and the kind of daily ritual you want to create.",
    routines: [{ title: "Dry & flaky", copy: "Layer Vanilla-Mint Shea Butter over damp skin and seal rough areas with body oil." }, { title: "Fresh body glow", copy: "Use Grapefruit Shea Butter after bathing, then finish with a light oil layer." }],
    benefits: ["Long-lasting moisture", "Comfort for rough areas", "Naturally radiant finish"]
  },
  hair: {
    eyebrow: "Hair and scalp care", title: "Healthy scalp. Nourished hair. Naturally beautiful.",
    intro: "Dedicated wash-day and between-wash-day care for natural, relaxed, braided, loc'd, colour-treated, and protective styles.",
    hero: "/assets/shea-chebe-haircare.png", categories: ["Hair Care"],
    promise: "Cleanse the scalp, replenish moisture, protect the ends, and keep every style manageable.",
    routines: [{ title: "Wash day", copy: "Cleanse the scalp, apply castor oil to damp hair, and use diluted rosemary oil for massage." }, { title: "Between washes", copy: "Refresh exposed scalp and dry ends with a small amount of oil two or three times weekly." }],
    benefits: ["Scalp moisture", "Length-retention support", "Softer, more manageable hair"]
  },
  gifts: {
    eyebrow: "Wellness gifting", title: "Thoughtful care, beautifully grouped for giving.",
    intro: "Curated Shea Wellness rituals for birthdays, corporate appreciation, hospitality, family care, and quiet moments of self-care.",
    hero: "/assets/sheawellness/grapefruit-shea-butter-lid.jpeg", categories: ["Gift Sets"],
    promise: "Gift-ready combinations with clear routines, premium presentation, and options for individual or corporate orders.",
    routines: [{ title: "Calm collection", copy: "Lavender shea, gentle cleansing, and aromatherapy for an evening wind-down." }, { title: "Glow collection", copy: "Grapefruit shea, black soap, and botanical oil for a complete body ritual." }],
    benefits: ["Ready-to-gift rituals", "Corporate order support", "Personalized collection choices"]
  },
  spa: {
    eyebrow: "SPA essentials", title: "Turn everyday spaces into places of restoration.",
    intro: "Essential oils, diffusers, humidifiers, massage care, and professional treatment-room supplies for homes and wellness businesses.",
    hero: "/assets/shea-essential-oils.png", categories: ["Spa Essentials", "Aromatherapy", "Essential Oils"],
    promise: "Create calm, refreshing spaces with clear aromatherapy guidance and professional-ready supplies.",
    routines: [{ title: "Home ritual", copy: "Pair a diffuser with a suitable essential oil and create a gentle morning or evening atmosphere." }, { title: "Professional care", copy: "Build treatment-room consistency with massage oils, disposables, and bulk-ready spa supplies." }],
    benefits: ["Home and professional use", "Aromatherapy guidance", "Wholesale and spa support"]
  }
};

export function SheaDepartmentPage({ kind }: { kind: DepartmentKind }) {
  const content = departmentContent[kind];
  const [products, setProducts] = useState<Product[]>(platformSnapshot.products);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const savedProducts = window.localStorage.getItem("sheaWellnessProducts");
    const savedCart = JSON.parse(window.localStorage.getItem("sheaWellnessCart") ?? "[]") as Array<{ quantity: number }>;
    if (savedProducts) {
      const parsed = JSON.parse(savedProducts) as Product[];
      if (Array.isArray(parsed) && parsed.length) setProducts(parsed);
    }
    setCartCount(savedCart.reduce((total, item) => total + item.quantity, 0));
  }, []);

  const departmentProducts = useMemo(() => products.filter((product) => content.categories.includes(product.category) && product.status !== "draft"), [content.categories, products]);

  return (
    <main className={`shea-department-page department-${kind}`}>
      <SheaGlobalHeader cartCount={cartCount} />
      <section className="department-hero">
        <div><span>{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p><div><a href="#department-products">Shop this collection <ArrowRight size={17} /></a><a className="secondary" href="/wellness-guides">Read care guides</a></div></div>
        <figure><img src={content.hero} alt={content.title} /><figcaption><Leaf size={17} /><span>{content.promise}</span></figcaption></figure>
      </section>

      <section className="department-benefits">
        {content.benefits.map((benefit) => <article key={benefit}><CheckCircle2 size={19} /><strong>{benefit}</strong></article>)}
      </section>

      <section className="department-routines">
        <div><span>How to use the collection</span><h2>Build a routine, not a crowded shelf.</h2></div>
        {content.routines.map((routine, index) => <article key={routine.title}><b>0{index + 1}</b><Sparkles size={20} /><strong>{routine.title}</strong><p>{routine.copy}</p></article>)}
      </section>

      <section className="department-products" id="department-products">
        <header><div><span>{content.eyebrow}</span><h2>Products for this routine.</h2></div><a href="/shop">View complete shop <ArrowRight size={17} /></a></header>
        <div>
          {departmentProducts.map((product) => <article key={product.id}>
            <a href={`/products/${encodeURIComponent(product.id)}`}><img src={product.imageUrl} alt={product.title} style={{ objectPosition: product.imagePosition }} /></a>
            <div><span>{product.badge}</span><h3>{product.title}</h3><p>{product.description}</p><footer><strong>{formatMoney(product.price, platformSnapshot.activeStore.currency)}</strong><a href={`/products/${encodeURIComponent(product.id)}`}><ShoppingBag size={16} /> View product</a></footer></div>
          </article>)}
        </div>
      </section>
    </main>
  );
}
