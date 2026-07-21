"use client";

import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Leaf, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";
import { platformSnapshot } from "@/lib/platform-data";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export type DepartmentKind = "face" | "skin" | "hair" | "gifts" | "spa";

const departmentContent: Record<DepartmentKind, {
  eyebrow: string; title: string; intro: string; categories: string[];
  promise: string; routines: Array<{ title: string; copy: string }>; benefits: string[];
}> = {
  face: {
    eyebrow: "Face care collection", title: "Cleanse gently. Nourish deeply. Glow naturally.",
    intro: "A complete botanical face routine built around African Liquid Black Soap, Rosehip Facial Oil, overnight shea moisture, and daily sun protection.",
    categories: ["Face Care"],
    promise: "Simple morning and evening care for clean, hydrated, comfortable skin.",
    routines: [{ title: "Morning", copy: "Cleanse, apply 2-4 drops of facial oil, then finish with broad-spectrum sunscreen." }, { title: "Evening", copy: "Cleanse, nourish with facial oil, and seal dry areas with a small amount of Lavender Shea Butter." }],
    benefits: ["Gentle daily cleansing", "Moisture-barrier support", "Soft, healthy-looking glow"]
  },
  skin: {
    eyebrow: "Skin and body care", title: "Comfort for dry, sensitive, and glow-seeking skin.",
    intro: "Pure shea butter and botanical infusions designed for dry patches, sensitive-feeling skin, body moisture, massage, and everyday radiance.",
    categories: ["Body Care"],
    promise: "Choose a butter by concern, texture, and the kind of daily ritual you want to create.",
    routines: [{ title: "Dry & flaky", copy: "Layer Vanilla-Mint Shea Butter over damp skin and seal rough areas with body oil." }, { title: "Fresh body glow", copy: "Use Grapefruit Shea Butter after bathing, then finish with a light oil layer." }],
    benefits: ["Long-lasting moisture", "Comfort for rough areas", "Naturally radiant finish"]
  },
  hair: {
    eyebrow: "Hair and scalp care", title: "Healthy scalp. Nourished hair. Naturally beautiful.",
    intro: "Dedicated wash-day and between-wash-day care for natural, relaxed, braided, loc'd, colour-treated, and protective styles.",
    categories: ["Hair Care"],
    promise: "Cleanse the scalp, replenish moisture, protect the ends, and keep every style manageable.",
    routines: [{ title: "Wash day", copy: "Cleanse the scalp, apply castor oil to damp hair, and use diluted rosemary oil for massage." }, { title: "Between washes", copy: "Refresh exposed scalp and dry ends with a small amount of oil two or three times weekly." }],
    benefits: ["Scalp moisture", "Length-retention support", "Softer, more manageable hair"]
  },
  gifts: {
    eyebrow: "Wellness gifting", title: "Thoughtful care, beautifully grouped for giving.",
    intro: "Curated Shea Wellness rituals for birthdays, corporate appreciation, hospitality, family care, and quiet moments of self-care.",
    categories: ["Gift Sets"],
    promise: "Gift-ready combinations with clear routines, premium presentation, and options for individual or corporate orders.",
    routines: [{ title: "Calm collection", copy: "Lavender shea, gentle cleansing, and aromatherapy for an evening wind-down." }, { title: "Glow collection", copy: "Grapefruit shea, black soap, and botanical oil for a complete body ritual." }],
    benefits: ["Ready-to-gift rituals", "Corporate order support", "Personalized collection choices"]
  },
  spa: {
    eyebrow: "SPA essentials", title: "Turn everyday spaces into places of restoration.",
    intro: "Essential oils, diffusers, humidifiers, massage care, and professional treatment-room supplies for homes and wellness businesses.",
    categories: ["Spa Essentials", "Aromatherapy", "Essential Oils"],
    promise: "Create calm, refreshing spaces with clear aromatherapy guidance and professional-ready supplies.",
    routines: [{ title: "Home ritual", copy: "Pair a diffuser with a suitable essential oil and create a gentle morning or evening atmosphere." }, { title: "Professional care", copy: "Build treatment-room consistency with massage oils, disposables, and bulk-ready spa supplies." }],
    benefits: ["Home and professional use", "Aromatherapy guidance", "Wholesale and spa support"]
  }
};

export function SheaDepartmentPage({ kind }: { kind: DepartmentKind }) {
  const content = departmentContent[kind];
  const [products, setProducts] = useState<Product[]>(platformSnapshot.products);
  const [cartCount, setCartCount] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

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
  const featuredProducts = departmentProducts.slice(0, 8);

  useEffect(() => {
    setCarouselIndex(0);
  }, [kind]);

  useEffect(() => {
    if (featuredProducts.length < 2) return;
    const timer = window.setInterval(() => setCarouselIndex((current) => (current + 1) % featuredProducts.length), 5500);
    return () => window.clearInterval(timer);
  }, [featuredProducts.length]);

  const moveCarousel = (direction: number) => {
    if (!featuredProducts.length) return;
    setCarouselIndex((current) => (current + direction + featuredProducts.length) % featuredProducts.length);
  };

  const featuredProduct = featuredProducts[carouselIndex];

  return (
    <main className={`shea-department-page department-${kind}`}>
      <SheaGlobalHeader cartCount={cartCount} />
      <section className="department-hero">
        <div><span>{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p><div><a href="#department-products">Shop this collection <ArrowRight size={17} /></a><a className="secondary" href="/wellness-guides">Read care guides</a></div></div>
        <div className="department-product-carousel" aria-label={`${content.eyebrow} product carousel`}>
          {featuredProduct ? (
            <>
              <div className="department-carousel-stage">
                <a href={`/products/${encodeURIComponent(featuredProduct.id)}`}>
                  <img src={featuredProduct.imageUrl} alt={featuredProduct.title} style={{ objectPosition: featuredProduct.imagePosition }} />
                </a>
                <div className="department-carousel-product-copy">
                  <span>{featuredProduct.badge || featuredProduct.category}</span>
                  <h2>{featuredProduct.title}</h2>
                  <strong>{formatMoney(featuredProduct.price, platformSnapshot.activeStore.currency)}</strong>
                  <a href={`/products/${encodeURIComponent(featuredProduct.id)}`}>View product <ArrowRight size={15} /></a>
                </div>
              </div>
              {featuredProducts.length > 1 && <>
                <button type="button" className="department-carousel-arrow previous" onClick={() => moveCarousel(-1)} aria-label="Previous product"><ChevronLeft /></button>
                <button type="button" className="department-carousel-arrow next" onClick={() => moveCarousel(1)} aria-label="Next product"><ChevronRight /></button>
                <div className="department-carousel-dots" aria-label="Choose a product">
                  {featuredProducts.map((product, index) => <button key={product.id} type="button" className={index === carouselIndex ? "active" : ""} onClick={() => setCarouselIndex(index)} aria-label={`Show ${product.title}`} />)}
                </div>
              </>}
              <div className="department-carousel-promise"><Leaf size={17} /><span>{content.promise}</span></div>
            </>
          ) : <p className="department-carousel-empty">New products for this collection are coming soon.</p>}
        </div>
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
