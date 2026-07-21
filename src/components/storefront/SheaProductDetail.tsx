"use client";

import { ArrowRight, CheckCircle2, Heart, Leaf, PackageCheck, RotateCcw, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";
import { formatMoney } from "@/lib/format";
import { platformSnapshot } from "@/lib/platform-data";
import { sheaVideos } from "@/lib/shea-content";
import type { Product } from "@/lib/types";
import { SheaCommerceFooter, SheaTrustGrid, SheaWhatsApp } from "@/components/storefront/SheaCommerceChrome";

type ProductReview = {
  source?: string;
  productId: string;
  name: string;
  rating: number;
  body: string;
  createdAt: string;
};

type StoredCartLine = {
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  size: string;
  quantity: number;
};

export function SheaProductDetail({ productId, initialProduct }: { productId: string; initialProduct?: Product | null }) {
  const [products, setProducts] = useState<Product[]>(platformSnapshot.products);
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [size, setSize] = useState(initialProduct?.sizes[0] ?? "100g");
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [wished, setWished] = useState(false);
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);

  useEffect(() => {
    const savedProducts = window.localStorage.getItem("sheaWellnessProducts");
    const parsedProducts = savedProducts ? (JSON.parse(savedProducts) as Product[]) : platformSnapshot.products;
    const nextProducts = Array.isArray(parsedProducts) && parsedProducts.length ? parsedProducts : platformSnapshot.products;
    const nextProduct = nextProducts.find((item) => item.id === productId) ?? platformSnapshot.products.find((item) => item.id === productId) ?? null;
    const savedReviews = JSON.parse(window.localStorage.getItem("sheaWellnessReviews") ?? "[]") as ProductReview[];
    const savedCart = JSON.parse(window.localStorage.getItem("sheaWellnessCart") ?? "[]") as StoredCartLine[];

    setProducts(nextProducts);
    setProduct(nextProduct);
    setSize(nextProduct?.sizes[0] ?? "100g");
    setReviews(savedReviews.filter((review) => review.source === "shea_storefront_review"));
    setCartCount(savedCart.reduce((total, line) => total + line.quantity, 0));
    const savedWishlist = JSON.parse(window.localStorage.getItem("sheaWellnessWishlist") ?? "[]") as string[];
    setWished(savedWishlist.includes(productId));
    const savedRecent = JSON.parse(window.localStorage.getItem("sheaWellnessRecentlyViewed") ?? "[]") as string[];
    const nextRecent = [productId, ...savedRecent.filter((id) => id !== productId)].slice(0, 8);
    window.localStorage.setItem("sheaWellnessRecentlyViewed", JSON.stringify(nextRecent));
    setRecentProductIds(nextRecent.filter((id) => id !== productId));
  }, [productId]);

  const productReviews = product ? reviews.filter((review) => review.productId === product.id) : [];
  const totalReviewCount = (product?.reviewCount ?? 0) + productReviews.length;
  const averageRating = product && totalReviewCount
    ? ((product.rating * product.reviewCount) + productReviews.reduce((total, review) => total + review.rating, 0)) / totalReviewCount
    : 0;
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4);
  }, [product, products]);
  const recentlyViewed = useMemo(() => recentProductIds.map((id) => products.find((item) => item.id === id)).filter((item): item is Product => Boolean(item)).slice(0, 4), [products, recentProductIds]);

  function toggleWishlist() {
    if (!product) return;
    const saved = JSON.parse(window.localStorage.getItem("sheaWellnessWishlist") ?? "[]") as string[];
    const next = saved.includes(product.id) ? saved.filter((id) => id !== product.id) : [...saved, product.id];
    window.localStorage.setItem("sheaWellnessWishlist", JSON.stringify(next));
    setWished(next.includes(product.id));
  }

  function addToCart() {
    if (!product) return;
    const savedCart = JSON.parse(window.localStorage.getItem("sheaWellnessCart") ?? "[]") as StoredCartLine[];
    const existingIndex = savedCart.findIndex((line) => line.productId === product.id && line.size === size);
    const nextCart = existingIndex >= 0
      ? savedCart.map((line, index) => index === existingIndex ? { ...line, quantity: line.quantity + 1 } : line)
      : [{ productId: product.id, title: product.title, imageUrl: product.imageUrl, price: product.price, size, quantity: 1 }, ...savedCart];

    window.localStorage.setItem("sheaWellnessCart", JSON.stringify(nextCart));
    setCartCount(nextCart.reduce((total, line) => total + line.quantity, 0));
    setNotice(`${product.title} added to cart.`);
  }

  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !reviewName.trim() || !reviewBody.trim()) return;
    const nextReview: ProductReview = {
      source: "shea_storefront_review",
      productId: product.id,
      name: reviewName.trim(),
      rating: reviewRating,
      body: reviewBody.trim(),
      createdAt: new Date().toISOString()
    };
    const nextReviews = [nextReview, ...reviews];
    setReviews(nextReviews);
    window.localStorage.setItem("sheaWellnessReviews", JSON.stringify(nextReviews));
    setReviewName("");
    setReviewRating(5);
    setReviewBody("");
  }

  if (!product) {
    return (
      <main className="shea-product-page">
        <SheaGlobalHeader cartCount={cartCount} />
        <section className="shea-product-not-found">
          <span>Product unavailable</span>
          <h1>This Shea Wellness product is not available in this browser.</h1>
          <p>If it was created in admin, open the shop in the same browser session or recreate the product from the dashboard.</p>
          <a href="/shop">Return to shop <ArrowRight size={18} /></a>
        </section>
      </main>
    );
  }

  return (
    <main className="shea-product-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: product.title, image: product.imageUrl, description: product.description, brand: { "@type": "Brand", name: "Shea Wellness" }, aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount }, offers: { "@type": "Offer", priceCurrency: platformSnapshot.activeStore.currency, price: product.price, availability: product.inventoryQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } }) }} />
      <SheaGlobalHeader cartCount={cartCount} />

      <section className="shea-product-detail-hero">
        <div className="shea-product-gallery">
          <div className="shea-product-main-image">
            <img src={product.imageUrl} alt={product.title} style={{ objectPosition: product.imagePosition }} />
          </div>
          <div className="shea-product-thumbs">
            <img src={product.imageUrl} alt="" style={{ objectPosition: product.imagePosition }} />
            <video src={sheaVideos[0].src} autoPlay muted loop playsInline preload="metadata" poster="/assets/shea-wellness-tree-logo.jpeg" />
          </div>
        </div>

        <article className="shea-product-buy-panel">
          <span>{product.category}</span>
          <h1>{product.title}</h1>
          <div className="shea-product-rating">
            <Star size={18} fill="currentColor" />
            <strong>{averageRating ? `${averageRating.toFixed(1)}/5` : "New"}</strong>
            <a href="#reviews">{totalReviewCount ? `${totalReviewCount} customer reviews` : "Write the first review"}</a>
          </div>
          <strong className="shea-product-price">{formatMoney(product.price, platformSnapshot.activeStore.currency)}</strong>
          <p>{product.description}</p>
          <div className="shea-live-stock"><i />{product.status === "low_stock" || product.inventoryQty <= 10 ? `Only ${product.inventoryQty} left — order soon` : `${product.inventoryQty} available and ready to ship`}</div>

          <div className="shea-product-facts">
            <div><strong>Material</strong><span>{product.material}</span></div>
            <div><strong>Benefit</strong><span>{product.deliveryBadge}</span></div>
            <div><strong>Care</strong><span>Store in a cool, dry place away from direct sunlight.</span></div>
          </div>

          <fieldset className="shea-product-size">
            <legend>Size</legend>
            {product.sizes.map((item) => (
              <button type="button" key={item} className={size === item ? "active" : ""} onClick={() => setSize(item)}>{item}</button>
            ))}
          </fieldset>

          <div className="shea-product-primary-actions"><button type="button" className="shea-product-add" onClick={addToCart}>
            <ShoppingCart size={20} />
            Add to cart
          </button><button type="button" className={wished ? "shea-product-wishlist active" : "shea-product-wishlist"} onClick={toggleWishlist} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}><Heart size={20} fill={wished ? "currentColor" : "none"} /></button></div>
          {notice ? <p className="shea-product-notice">{notice}</p> : null}

          <div className="shea-product-assurance">
            <span><Truck size={19} /> Delivery options available</span>
            <span><ShieldCheck size={19} /> Handmade Shea Wellness product</span>
            <span><PackageCheck size={19} /> Export-ready packaging</span>
          </div>
        </article>
      </section>

      <section className="shea-product-description">
        <div>
          <span>Description</span>
          <h2>How this product fits into a Shea Wellness routine.</h2>
          <p>{product.description} Use it as part of a clean, consistent routine: cleanse gently, apply a measured amount, massage slowly, and let the skin or hair absorb before layering more product.</p>
        </div>
        <div>
          <span>Ingredients</span>
          <h2>{product.material}</h2>
          <p>Shea Wellness products are positioned around natural ingredients, ethical Nilotica shea, and practical daily use for body, face, hair, aromatherapy, and spa care.</p>
        </div>
      </section>

      <section className="shea-product-guide-grid">
        <article><Leaf size={22} /><span>Ingredients</span><h2>What is inside.</h2><p>{product.material}. Nature-led ingredients selected for practical everyday skin, hair, body, or spa use.</p></article>
        <article><CheckCircle2 size={22} /><span>Benefits</span><h2>Why customers choose it.</h2><ul><li>{product.deliveryBadge}</li><li>Supports a simple, consistent wellness routine</li><li>Made with Shea Wellness quality standards</li></ul></article>
        <article><RotateCcw size={22} /><span>Directions</span><h2>How to use.</h2><p>Apply a measured amount to clean skin or hair. Massage gently until absorbed. Start with less, layer only where needed, and patch-test before first use.</p></article>
        <article><Truck size={22} /><span>Shipping</span><h2>Delivery and returns.</h2><p>Kenya delivery and international wholesale support are available. Damaged or incorrect orders are handled under our refund policy.</p><a href="/shipping-policy">Read shipping information</a></article>
      </section>

      <section className="shea-product-faq" id="faq"><div><span>Product FAQ</span><h2>Good to know before you order.</h2></div><div><details><summary>Is this suitable for sensitive skin?</summary><p>Patch-test first and introduce one product at a time. Stop use if irritation occurs.</p></details><details><summary>How should I store it?</summary><p>Keep it sealed in a cool, dry place away from direct sunlight and excess heat.</p></details><details><summary>Can I order for a spa or retail store?</summary><p>Yes. Contact our wholesale team for bulk sizes, pricing, and fulfilment guidance.</p></details></div></section>

      <section className="shea-product-reviews" id="reviews">
        <div className="shea-product-review-copy">
          <span>Customer reviews</span>
          <h2>{productReviews.length ? "What customers are saying." : "Be the first to review this product."}</h2>
          <p>Reviews submitted here appear in the Shea Wellness admin review center.</p>
        </div>
        <div className="shea-product-review-panel">
          {productReviews.length ? (
            <div className="shea-product-review-list">
              {productReviews.map((review) => (
                <article key={`${review.productId}-${review.createdAt}`}>
                  <strong>{review.name}</strong>
                  <span>{review.rating}/5</span>
                  <p>{review.body}</p>
                </article>
              ))}
            </div>
          ) : null}
          <form onSubmit={submitReview}>
            <input value={reviewName} onChange={(event) => setReviewName(event.target.value)} placeholder="Your name" aria-label="Your name" />
            <select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))} aria-label="Rating">
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
            <textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} placeholder="Share your product experience" aria-label="Review" />
            <button type="submit">Submit review</button>
          </form>
        </div>
      </section>

      {relatedProducts.length ? (
        <section className="shea-product-related">
          <div className="shea-section-title">
            <span>Related products</span>
            <h2>Customers also view these Shea Wellness products.</h2>
          </div>
          <div>
            {relatedProducts.map((item) => (
              <a href={`/products/${encodeURIComponent(item.id)}`} key={item.id}>
                <img src={item.imageUrl} alt={item.title} style={{ objectPosition: item.imagePosition }} />
                <strong>{item.title}</strong>
                <span>{formatMoney(item.price, platformSnapshot.activeStore.currency)}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {relatedProducts.length >= 2 ? <section className="shea-frequently-bought"><div><span>Frequently bought together</span><h2>Build a complete routine.</h2><p>Pair {product.title} with complementary care from the same collection.</p></div><div>{[product, ...relatedProducts.slice(0, 2)].map((item) => <a href={`/products/${encodeURIComponent(item.id)}`} key={item.id}><img src={item.imageUrl} alt={item.title} loading="lazy" /><strong>{item.title}</strong><span>{formatMoney(item.price, platformSnapshot.activeStore.currency)}</span></a>)}</div></section> : null}

      {recentlyViewed.length ? <section className="shea-product-related recently-viewed"><div className="shea-section-title"><span>Recently viewed</span><h2>Continue where you left off.</h2></div><div>{recentlyViewed.map((item) => <a href={`/products/${encodeURIComponent(item.id)}`} key={item.id}><img src={item.imageUrl} alt={item.title} loading="lazy" /><strong>{item.title}</strong><span>{formatMoney(item.price, platformSnapshot.activeStore.currency)}</span></a>)}</div></section> : null}

      <SheaTrustGrid />
      <SheaCommerceFooter cartCount={cartCount} />
      <SheaWhatsApp />
      <div className="shea-sticky-cart"><div><strong>{product.title}</strong><span>{formatMoney(product.price, platformSnapshot.activeStore.currency)}</span></div><button type="button" onClick={addToCart}><ShoppingCart size={18} /> Add to cart</button></div>
    </main>
  );
}
