"use client";
import { ProductCard } from "./ProductCard";
import { suggestedProducts } from "@/lib/product-presentation";

import { StorefrontImage } from "./StorefrontImage";
import { ArrowRight, CheckCircle2, Heart, Leaf, PackageCheck, RotateCcw, ShieldCheck, ShoppingCart, Sparkles, Star, Truck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatMoney, productPriceForSize } from "@/lib/format";
import { platformSnapshot } from "@/lib/platform-data";
import { readStoredArray } from "@/lib/browser-storage";
import { useStorefrontCart } from "./StorefrontCart";
import { isSidewaysSheaProductAsset } from "@/lib/shea-media";
import { botanicalDetails, productPairings } from "@/lib/shea-website-content";
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
  const [galleryImage, setGalleryImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(initialProduct?.sizes[0] ?? "100g");
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const sharedCart = useStorefrontCart();
  const [notice, setNotice] = useState("");
  const [wished, setWished] = useState(false);
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);

  useEffect(() => {
    const requestedOption = new URLSearchParams(location.search).get("option");
    if (requestedOption && initialProduct?.sizes.includes(requestedOption)) setSize(requestedOption);
    const savedReviews = readStoredArray("sheaWellnessReviews") as ProductReview[];
    const savedCart = readStoredArray("sheaWellnessCart") as StoredCartLine[];

    setReviews(savedReviews.filter((review) => review.source === "shea_storefront_review"));
    setCartCount(savedCart.reduce((total, line) => total + line.quantity, 0));
    const savedWishlist = readStoredArray("sheaWellnessWishlist") as string[];
    setWished(savedWishlist.includes(productId));
    const savedRecent = readStoredArray("sheaWellnessRecentlyViewed") as string[];
    const nextRecent = [productId, ...savedRecent.filter((id) => id !== productId)].slice(0, 8);
    window.localStorage.setItem("sheaWellnessRecentlyViewed", JSON.stringify(nextRecent));
    setRecentProductIds(nextRecent.filter((id) => id !== productId));
    void fetch("/api/storefront/content", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json();
        const nextProducts = Array.isArray(payload.data?.products) ? payload.data.products as Product[] : [];
        const nextProduct = nextProducts.find((item) => item.id === productId && (item.status === "active" || item.status === "low_stock")) ?? null;
        setProducts(nextProducts.filter((item) => item.status === "active" || item.status === "low_stock"));
        setProduct(nextProduct);
        setSize(requestedOption && nextProduct?.sizes.includes(requestedOption) ? requestedOption : nextProduct?.sizes[0] ?? "100g");
      })
      .catch(() => undefined);
  }, [productId]);

  const productReviews = product ? reviews.filter((review) => review.productId === product.id) : [];
  const totalReviewCount = (product?.reviewCount ?? 0) + productReviews.length;
  const averageRating = product && totalReviewCount
    ? ((product.rating * product.reviewCount) + productReviews.reduce((total, review) => total + review.rating, 0)) / totalReviewCount
    : 0;
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return suggestedProducts(product, products);
  }, [product, products]);
  const recentlyViewed = useMemo(() => recentProductIds.map((id) => products.find((item) => item.id === id)).filter((item): item is Product => Boolean(item)).slice(0, 4), [products, recentProductIds]);
  const botanicalDetail = botanicalDetails.find((item) => item.productId === product?.id);
  const matchingPairings = product
    ? productPairings.filter((pairing) => pairing.products.some((item) => item.toLowerCase().includes(product.title.replace("Cold-Pressed ", "").replace("Cold Pressed ", "").toLowerCase().split(" ").slice(0, 2).join(" ")))).slice(0, 3)
    : [];
  const selectedMedia = product?.sizeMedia?.[size];
  const selectedImage = galleryImage ?? selectedMedia?.imageUrl ?? product?.imageUrl ?? "";
  const galleryImages = [...new Set([selectedMedia?.imageUrl ?? product?.imageUrl ?? "", ...(product?.gallery ?? []), ...Object.values(product?.sizeMedia ?? {}).map(item => item.imageUrl || "")].filter(Boolean))];
  useEffect(() => {setGalleryImage(null);}, [size, productId]);
  const selectedImagePosition = selectedMedia?.imagePosition ?? product?.imagePosition;
  const selectedVideo = selectedMedia?.videoUrl;
  const selectedImageIsSideways = isSidewaysSheaProductAsset(selectedImage);

  function toggleWishlist() {
    if (!product) return;
    const saved = readStoredArray("sheaWellnessWishlist") as string[];
    const next = saved.includes(product.id) ? saved.filter((id) => id !== product.id) : [...saved, product.id];
    window.localStorage.setItem("sheaWellnessWishlist", JSON.stringify(next));
    setWished(next.includes(product.id));
  }

  function addToCart() {
    if (!product || product.inventoryQty < 1) return;
    sharedCart.add(product, size, quantity);
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
        <section className="shea-product-not-found">
          <span>Product unavailable</span>
          <h1>This Shea Wellness product is not available in this browser.</h1>
          <p>It may be unavailable, retired, or still in draft. Return to the shop to browse the current live catalogue.</p>
          <a href="/shop">Return to shop <ArrowRight size={18} /></a>
        </section>
      </main>
    );
  }

  return (
    <main className="shea-product-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: product.title, image: product.imageUrl, description: product.description, brand: { "@type": "Brand", name: "Shea Wellness" }, ...(product.reviewCount > 0 ? {aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount }} : {}), offers: { "@type": "Offer", priceCurrency: platformSnapshot.activeStore.currency, price: product.price, availability: product.inventoryQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } }) }} />

      <section className="shea-product-detail-hero">
        <div className="shea-product-gallery">
          <div className={`shea-product-main-image${selectedImageIsSideways ? " is-rotated" : ""}`}>
            <StorefrontImage className={selectedImageIsSideways ? "shea-rotated-product-image" : undefined} src={selectedImage} alt={galleryImage ? `Additional view of ${product.title}` : `${product.title}${size ? ` — ${size}` : ""}`} style={{ objectPosition: selectedImagePosition }} />
          </div>
          <div className="shea-product-thumbs" aria-label="Product gallery">
            {galleryImages.map((image, index) => <button type="button" key={image} aria-label={`View product photo ${index + 1}`} aria-pressed={selectedImage === image} onClick={() => {const variant = Object.entries(product.sizeMedia ?? {}).find(([, media]) => media.imageUrl === image); if (variant) {setSize(variant[0]);setGalleryImage(null);} else setGalleryImage(image);}}><StorefrontImage src={image} alt="" loading="lazy" /></button>)}
          </div>
          {selectedVideo && <details className="product-film-toggle"><summary>Watch product video</summary><video className="shea-product-film" src={selectedVideo} controls playsInline preload="none" poster={selectedImage || undefined} aria-label={`${product.title} product film`} /></details>}

        </div>

        <article className="shea-product-buy-panel">
          <span>{product.category}</span>
          <h1>{product.title}</h1>
          <div className="shea-product-rating">
            <Star size={18} fill="currentColor" />
            <strong>{averageRating ? `${averageRating.toFixed(1)}/5` : "New"}</strong>
            <a href="#reviews">{totalReviewCount ? `${totalReviewCount} customer reviews` : "Write the first review"}</a>
          </div>
          <strong className="shea-product-price">{formatMoney(productPriceForSize(product, size), platformSnapshot.activeStore.currency)}</strong>
          <p>{product.description}</p>
          <div className="shea-live-stock"><i />{product.inventoryQty < 1 ? "Contact us for availability" : product.status === "low_stock" || product.inventoryQty <= 10 ? `Only ${product.inventoryQty} left — order soon` : `${product.inventoryQty} available and ready to ship`}</div>

          <div className="shea-product-facts">
            <div><strong>Material</strong><span>{product.material}</span></div>
            <div><strong>Benefit</strong><span>{product.deliveryBadge}</span></div>
            <div><strong>Care</strong><span>Store in a cool, dry place away from direct sunlight.</span></div>
          </div>

          <fieldset className="shea-product-size">
            <legend>Choose your size or option</legend>
            {product.sizes.map((item) => (
              <button type="button" key={item} className={size === item ? "active" : ""} aria-pressed={size === item} onClick={() => {setSize(item);setGalleryImage(null);}}>{item}</button>
            ))}

          </fieldset>

          {product.inventoryQty > 0 && <label className="product-quantity">Quantity<input aria-label="Product quantity" type="number" min="1" max={Math.min(25, product.inventoryQty)} value={quantity} onChange={event => setQuantity(Math.max(1, Math.min(Number(event.target.value) || 1, 25, product.inventoryQty)))} /></label>}
          <div className="shea-product-primary-actions"><button type="button" className="shea-product-add" onClick={addToCart} disabled={product.inventoryQty < 1}>
            <ShoppingCart size={20} />
            {product.inventoryQty < 1 ? "Unavailable online" : "Add to cart"}
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
          <h2>{botanicalDetail?.scientificName ?? product.material}</h2>
          <p>{botanicalDetail?.origin ?? "Shea Wellness products are positioned around natural ingredients, ethical Nilotica shea, and practical daily use for body, face, hair, aromatherapy, and spa care."}</p>
        </div>
      </section>

      <section className="shea-product-guide-grid botanical">
        <article><Leaf size={22} /><span>Key nutrients</span><h2>What is inside.</h2>{botanicalDetail ? <ul>{botanicalDetail.nutrients.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{product.material}. Nature-led ingredients selected for practical everyday use.</p>}</article>
        <article><CheckCircle2 size={22} /><span>Benefits</span><h2>Why customers choose it.</h2><ul>{(botanicalDetail?.benefits ?? [product.deliveryBadge, "Supports a simple, consistent wellness routine", "Made with Shea Wellness quality standards"]).map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><RotateCcw size={22} /><span>Morning routine</span><h2>Start protected.</h2>{botanicalDetail ? <ol>{botanicalDetail.morning.map((item) => <li key={item}>{item}</li>)}</ol> : <p>Apply a measured amount to clean skin or hair and patch-test before first use.</p>}</article>
        <article><RotateCcw size={22} /><span>Evening routine</span><h2>Nourish overnight.</h2>{botanicalDetail ? <ol>{botanicalDetail.evening.map((item) => <li key={item}>{item}</li>)}</ol> : <p>Apply a measured amount to clean skin or hair and massage gently until absorbed.</p>}</article>
        {botanicalDetail?.additionalUse ? <article><Sparkles size={22} /><span>More ways to use it</span><h2>Face, body and hair.</h2><ul>{botanicalDetail.additionalUse.map((item) => <li key={item}>{item}</li>)}</ul></article> : null}
        {botanicalDetail ? <article><ShieldCheck size={22} /><span>Suitability & care</span><h2>Use it thoughtfully.</h2><p><strong>Suitable for:</strong> {botanicalDetail.suitableFor.join(", ")}.</p><p>{botanicalDetail.caution}</p></article> : null}
        <article><Truck size={22} /><span>Shipping</span><h2>Delivery and returns.</h2><p>Kenya delivery and international wholesale support are available. Damaged or incorrect orders are handled under our refund policy.</p><a href="/shipping-policy">Read shipping information</a></article>
      </section>

      {matchingPairings.length ? <section className="shea-product-pairing-block"><div><span>Perfect pairings</span><h2>Choose the right solution.</h2><p>Complete your routine with concern-led combinations from Shea Wellness.</p></div><div>{matchingPairings.map((pairing) => <article key={pairing.concern}><span>For</span><h3>{pairing.concern}</h3><p>{pairing.products.join(" + ")}</p><ul>{pairing.benefits.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></section> : null}

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

      {relatedProducts.length > 0 && <section className="shea-product-related refined-recommendations"><div className="shea-section-title"><span>Complete your ritual</span><h2>You may also like.</h2></div><div className="commerce-product-grid">{relatedProducts.map(item => <ProductCard key={item.id} product={item} currency={platformSnapshot.activeStore.currency} />)}</div></section>}
      {recentlyViewed.length > 0 && <section className="shea-product-related refined-recommendations"><div className="shea-section-title"><span>Recently viewed</span><h2>A second look.</h2></div><div className="commerce-product-grid">{recentlyViewed.map(item => <ProductCard key={item.id} product={item} currency={platformSnapshot.activeStore.currency} />)}</div></section>}

      <div className="shea-sticky-cart"><div><strong>{product.title}</strong><span>{formatMoney(productPriceForSize(product, size), platformSnapshot.activeStore.currency)}</span></div><button type="button" onClick={addToCart} disabled={product.inventoryQty < 1}><ShoppingCart size={18} /> {product.inventoryQty < 1 ? "Unavailable online" : "Add to cart"}</button></div>
      {product.inventoryQty < 1 ? <p className="owner-availability"><a href="/contact">Ask about availability</a></p> : null}
      <SheaTrustGrid />
      <SheaCommerceFooter />
      <SheaWhatsApp />
    </main>
  );
}
