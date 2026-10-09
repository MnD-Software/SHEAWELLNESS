"use client";

import { StorefrontImage } from "./StorefrontImage";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Heart, ShoppingBag, ShoppingCart, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { platformSnapshot } from "@/lib/platform-data";
import { readStoredArray } from "@/lib/browser-storage";
import { useStorefrontCart } from "./StorefrontCart";
import { formatMoney, productPriceForSize } from "@/lib/format";
import { isSidewaysSheaProductAsset } from "@/lib/shea-media";
import type { Product } from "@/lib/types";
import { SheaCommerceFooter, SheaTrustGrid, SheaWhatsApp } from "@/components/storefront/SheaCommerceChrome";

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
    eyebrow: "Skin care collection", title: "Comfort for dry, sensitive, and glow-seeking skin.",
    intro: "Pure shea butter and botanical infusions designed for dry patches, sensitive-feeling skin, body moisture, massage, and everyday radiance.",
    categories: ["Skin Care"],
    promise: "Choose a butter by concern, texture, and the kind of daily routine you want to create.",
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
    intro: "Curated Shea Wellness routines for birthdays, corporate appreciation, hospitality, family care, and quiet moments of self-care.",
    categories: ["Gift Sets"],
    promise: "Gift-ready combinations with clear routines, premium presentation, and options for individual or corporate orders.",
    routines: [{ title: "Calm collection", copy: "Lavender shea, gentle cleansing, and aromatherapy for an evening wind-down." }, { title: "Glow collection", copy: "Grapefruit shea, black soap, and botanical oil for a complete body routine." }],
    benefits: ["Ready-to-gift routines", "Corporate order support", "Personalized collection choices"]
  },
  spa: {
    eyebrow: "SPA essentials", title: "Turn everyday spaces into places of restoration.",
    intro: "Essential oils, diffusers, humidifiers, massage care, and professional treatment-room supplies for homes and wellness businesses.",
    categories: ["Spa Essentials", "Aromatherapy", "Essential Oils"],
    promise: "Create calm, refreshing spaces with clear aromatherapy guidance and professional-ready supplies.",
    routines: [{ title: "Home routine", copy: "Pair a diffuser with a suitable essential oil and create a gentle morning or evening atmosphere." }, { title: "Professional care", copy: "Build treatment-room consistency with massage oils, disposables, and bulk-ready spa supplies." }],
    benefits: ["Home and professional use", "Aromatherapy guidance", "Wholesale and spa support"]
  }
};

export function SheaDepartmentPage({ kind, initialProducts }: { kind: DepartmentKind; initialProducts: Product[] }) {
  const content = departmentContent[kind];
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cartCount, setCartCount] = useState(0);
  const sharedCart = useStorefrontCart();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    const savedCart = readStoredArray("sheaWellnessCart") as Array<{ quantity: number }>;
    setCartCount(savedCart.reduce((total, item) => total + item.quantity, 0));
    setWishlist(readStoredArray("sheaWellnessWishlist") as string[]);
    void fetch("/api/storefront/content", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json();
        if (Array.isArray(payload.data?.products)) setProducts(payload.data.products as Product[]);
      })
      .catch(() => undefined);
  }, []);

  const departmentProducts = useMemo(() => products.filter((product) => content.categories.includes(product.category) && (product.status === "active" || product.status === "low_stock")), [content.categories, products]);
  const featuredProducts = departmentProducts.slice(0, 8);

  useEffect(() => {
    setCarouselIndex(0);
  }, [kind]);

  const moveCarousel = (direction: number) => {
    if (!featuredProducts.length) return;
    setCarouselIndex((current) => (current + direction + featuredProducts.length) % featuredProducts.length);
  };

  const featuredProduct = featuredProducts[carouselIndex % Math.max(featuredProducts.length, 1)];

  function toggleWishlist(productId: string) {
    setWishlist((current) => { const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]; window.localStorage.setItem("sheaWellnessWishlist", JSON.stringify(next)); return next; });
  }

  function quickAdd(product: Product) {
    sharedCart.add(product, product.sizes[0] ?? "One size");
    sharedCart.open();
  }

  return (
    <main className={`shea-department-page department-${kind}`}>
      <section className="department-hero">
        <div><span>{content.eyebrow}</span><h1>{content.title}</h1><p>{content.intro}</p><div><a href="#department-products">Shop this collection <ArrowRight size={17} /></a><a className="secondary" href="/wellness-guides">Read care guides</a></div></div>
        <div className="department-product-carousel shea-carousel-shell" aria-label={`${content.eyebrow} product carousel`}>
          {featuredProduct ? (
            <>
              <div className="department-carousel-stage">
                <a className={isSidewaysSheaProductAsset(featuredProduct.imageUrl) ? "department-carousel-image is-rotated" : "department-carousel-image"} href={`/products/${encodeURIComponent(featuredProduct.id)}`}>
                  <StorefrontImage className={isSidewaysSheaProductAsset(featuredProduct.imageUrl) ? "shea-rotated-product-image" : undefined} src={featuredProduct.imageUrl} alt={featuredProduct.title} style={{ objectPosition: featuredProduct.imagePosition }} />
                </a>
                <div className="department-carousel-product-copy">
                  <span>{featuredProduct.badge || featuredProduct.category}</span>
                  <h2>{featuredProduct.title}</h2>
                  <strong>{formatMoney(featuredProduct.price, platformSnapshot.activeStore.currency)}</strong>
                  <a href={`/products/${encodeURIComponent(featuredProduct.id)}`}>View product <ArrowRight size={15} /></a>
                </div>
              </div>
              {featuredProducts.length > 1 && <>
                <button type="button" className="department-carousel-arrow shea-carousel-control previous" onClick={() => moveCarousel(-1)} aria-label="Previous product"><ChevronLeft /></button>
                <button type="button" className="department-carousel-arrow shea-carousel-control next" onClick={() => moveCarousel(1)} aria-label="Next product"><ChevronRight /></button>
                <div className="department-carousel-dots shea-carousel-pagination" aria-label="Choose a product">
                  {featuredProducts.map((product, index) => <button key={product.id} type="button" className={index === carouselIndex ? "active" : ""} onClick={() => setCarouselIndex(index)} aria-label={`Show ${product.title}`} />)}
                </div>
              </>}
            </>
          ) : <p className="department-carousel-empty">New products for this collection are coming soon.</p>}
        </div>
      </section>

      <section className="department-products" id="department-products">
        <header><div><span>{content.eyebrow}</span><h2>Products for this routine.</h2></div><a href="/shop">View complete shop <ArrowRight size={17} /></a></header>
        <div>
          {departmentProducts.map((product) => <article key={product.id} className="department-product-card">
            <a className={isSidewaysSheaProductAsset(product.imageUrl) ? "is-rotated" : undefined} href={`/products/${encodeURIComponent(product.id)}`}><StorefrontImage className={isSidewaysSheaProductAsset(product.imageUrl) ? "shea-rotated-product-image" : undefined} src={product.imageUrl} alt={product.title} style={{ objectPosition: product.imagePosition }} /></a>
            <button type="button" className={wishlist.includes(product.id) ? "department-card-wishlist active" : "department-card-wishlist"} onClick={() => toggleWishlist(product.id)} aria-label={`Add ${product.title} to wishlist`}><Heart size={17} fill={wishlist.includes(product.id) ? "currentColor" : "none"} /></button>
            <div><span>{product.badge}</span><h3>{product.title}</h3><div className="department-card-rating"><Star size={14} fill="currentColor" /> {product.rating.toFixed(1)} <small>({product.reviewCount} reviews)</small></div><p>{product.description}</p><div className="department-card-stock"><i />{product.inventoryQty < 1 ? "Enquire for availability" : product.status === "low_stock" ? `Only ${product.inventoryQty} left` : "In stock"}</div><footer><strong>{formatMoney(product.price, platformSnapshot.activeStore.currency)}</strong><button type="button" onClick={() => quickAdd(product)} disabled={product.inventoryQty < 1}><ShoppingCart size={16} /> {product.inventoryQty < 1 ? "Unavailable online" : "Quick add"}</button><a href={`/products/${encodeURIComponent(product.id)}`} aria-label={`View ${product.title}`}><ShoppingBag size={16} /></a></footer></div>
          </article>)}
        </div>
      </section>

      <section className="department-benefits">
        {content.benefits.map((benefit) => <article key={benefit}><CheckCircle2 size={19} /><strong>{benefit}</strong></article>)}
      </section>

      <section className="department-routines">
        <div><span>How to use the collection</span><h2>Build a routine, not a crowded shelf.</h2></div>
        {content.routines.map((routine, index) => <article key={routine.title}><b>0{index + 1}</b><Sparkles size={20} /><strong>{routine.title}</strong><p>{routine.copy}</p></article>)}
      </section>
      <SheaTrustGrid /><SheaCommerceFooter /><SheaWhatsApp />
    </main>
  );
}
