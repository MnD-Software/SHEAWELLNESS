"use client";
import { ProductCard } from "./ProductCard";
import { arrangeProducts } from "@/lib/product-presentation";
import { productMinimumPrice } from "@/lib/format";

import { StorefrontImage } from "./StorefrontImage";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Eye,
  Grid2X2,
  Home,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Truck,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { CampaignCarousel } from "./CampaignCarousel";
import { readStoredArray } from "@/lib/browser-storage";
import { formatMoney, productPriceForSize } from "@/lib/format";
import { isSidewaysSheaProductAsset } from "@/lib/shea-media";
import { categoryToSlug } from "@/lib/product-routing";
import { replaceRetiredSyntheticImage, sanitizeSheaMediaConfig, sheaDefaultMediaConfig, type SheaMediaConfig } from "@/lib/shea-content";
import { useStorefrontCart } from "./StorefrontCart";
import { SheaCommerceFooter, SheaTrustGrid, SheaWhatsApp } from "@/components/storefront/SheaCommerceChrome";
import type { Product, Store } from "@/lib/types";
import { quickFaqs } from "@/lib/shea-website-content";
import { ownerAsset, ownerRoutineImages } from "@/lib/owner-media";
import { OwnerPartners, OwnerRoutineProgress } from "./OwnerSuppliedMedia";

type CartLine = {
  product: Product;
  quantity: number;
  size: string;
};

type StoredCartLine = {
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  size: string;
  quantity: number;
};

type ProductReview = {
  source?: string;
  productId: string;
  name: string;
  rating: number;
  body: string;
  createdAt: string;
};

type CheckoutStep = "information" | "delivery" | "payment" | "review" | "success";

type CheckoutForm = {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  deliveryMethod: "kenya" | "international";
  paymentMethod: "card" | "paypal" | "mpesa";
};

const defaultStorefrontMedia = sanitizeSheaMediaConfig(sheaDefaultMediaConfig);

const defaultForm: CheckoutForm = {
  email: "",
  fullName: "",
  phone: "",
  address: "",
  country: "Kenya",
  city: "",
  deliveryMethod: "kenya",
  paymentMethod: "card"
};

const concernCards = [
  {
    title: "Dry & flaky skin",
    body: "Cleanse gently, replenish lost moisture, and seal comfort into rough or flaky patches.",
    image: "/assets/sheawellness/vanilla-mint-shea-butter.jpeg",
    href: "/wellness-guides#dry-flaky-skin"
  },
  {
    title: "Sensitive skin solution",
    body: "Barrier-first care with African black soap, lavender shea butter, and patch-test guidance.",
    image: "/assets/sheawellness/lavender-shea-butter-front.jpeg",
    href: "/wellness-guides#sensitive-skin"
  },
  {
    title: "Fresh body glow",
    body: "Refresh, moisturize, and finish with body oil for softer, naturally radiant skin.",
    image: "/assets/sheawellness/grapefruit-shea-butter-front.jpeg",
    href: "/wellness-guides#body-glow"
  },
  {
    title: "Face routine",
    body: "A simple three-step routine: cleanse, nourish, and protect by day; restore by night.",
    image: "/assets/website-edits/spa-facial.jpg",
    href: "/wellness-guides#face-care"
  },
  {
    title: "Hair & scalp moisture",
    body: "Clean scalp care, castor oil moisture, and rosemary scalp-massage support.",
    image: "/assets/media-library/aug-2026/aug-2026-028.jpeg",
    href: "/wellness-guides#hair-scalp"
  },
  {
    title: "Spa essentials",
    body: "Essential oils, diffusers, humidifiers, and treatment-room supplies for wellness spaces.",
    image: "/assets/media-library/aug-2026/aug-2026-057.jpeg",
    href: "/wellness-guides#spa-essentials"
  }
];

const comparisonRows = [
  ["100% Natural", true, false],
  ["No Harsh Chemicals", true, false],
  ["Supports Skin Barrier", true, false],
  ["Suitable for Sensitive Skin", true, false],
  ["Routine Education Included", true, false]
] as const;

const routineProgressSlides = [
  {
    title: "Gentle cleansing",
    image: "/assets/website-edits/black-soap-body-wash-pair.jpg",
    labels: ["Step 1", "Cleanse"]
  },
  {
    title: "Moisture layering",
    image: "/assets/sheawellness/vanilla-mint-shea-butter.jpeg",
    labels: ["Step 2", "Moisturise"]
  },
  {
    title: "Scalp and hair moisture",
    image: "/assets/media-library/aug-2026/aug-2026-028.jpeg",
    labels: ["Step 3", "Nourish"]
  },
  {
    title: "A calm wellness space",
    image: "/assets/media-library/aug-2026/aug-2026-057.jpeg",
    labels: ["Step 4", "Restore"]
  }
];

export function CommerceStorefront({
  store,
  products,
  initialSearch = "",
  featuredProductLimit,
  initialMedia,
  initialWellnessGuidesEnabled = false,
  cartOnly = false
}: {
  store: Store;
  products: Product[];
  initialSearch?: string;
  featuredProductLimit?: number;
  initialMedia?: SheaMediaConfig;
  initialWellnessGuidesEnabled?: boolean;
  cartOnly?: boolean;
}) {
  const [catalogProducts, setCatalogProducts] = useState(products);
  const liveProducts = catalogProducts.filter((product) => product.status === "active" || product.status === "low_stock");
  const categories = ["All", ...Array.from(new Set(liveProducts.map((product) => product.category)))];
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState(initialSearch);
  const [sort, setSort] = useState("featured");
  const { cart, setCart, add: addSharedCart, open: openSharedCart } = useStorefrontCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("information");
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(defaultForm);
  const [orderNumber, setOrderNumber] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const checkoutRequestId = useRef<string | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [mediaConfig, setMediaConfig] = useState<SheaMediaConfig>(initialMedia ?? defaultStorefrontMedia);
  const wellnessGuidesEnabled = initialWellnessGuidesEnabled;

  const heroSlides = mediaConfig.heroSlides;
  const mediaVideos = [...mediaConfig.videos].sort((left, right) => Number(right.id.startsWith("owner_oct_")) - Number(left.id.startsWith("owner_oct_")));


  useEffect(() => {
    if (cartOnly) return;
    void fetch("/api/storefront/content", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json();
        setMediaConfig(sanitizeSheaMediaConfig(payload.data.media as SheaMediaConfig));
        setCatalogProducts((payload.data.products as Product[]).map((product) => ({ ...product, imageUrl: replaceRetiredSyntheticImage(product.imageUrl) })));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setWishlist(readStoredArray("sheaWellnessWishlist") as string[]);
    if (cartOnly && new URLSearchParams(window.location.search).get("cart") === "open") setCartOpen(true);
  }, []);



  useEffect(() => {
    const savedReviews = window.localStorage.getItem("sheaWellnessReviews");
    if (savedReviews) {
      setReviews(readStoredArray("sheaWellnessReviews") as ProductReview[]);
    }
  }, []);

  useEffect(() => {
    if (!cartOnly) return;
    const open = () => setCartOpen(true);
    window.addEventListener("shea-cart-open", open);
    return () => window.removeEventListener("shea-cart-open", open);
  }, [cartOnly]);
  useEffect(() => {
    if (!cartOnly || (!cartOpen && !checkoutOpen)) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dismiss = (event: KeyboardEvent) => { if (event.key === "Escape") { setCartOpen(false); setCheckoutOpen(false); } };
    window.addEventListener("keydown", dismiss);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", dismiss); };
  }, [cartOnly, cartOpen, checkoutOpen]);

  const filteredProducts = useMemo(() => {
    const nextProducts = liveProducts.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const term = `${product.title} ${product.description} ${product.category}`.toLowerCase();
      const matchesQuery = !query.trim() || term.includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });

    return arrangeProducts(nextProducts).sort((a, b) => {
      if (sort === "price-low") return productMinimumPrice(a) - productMinimumPrice(b);
      if (sort === "price-high") return productMinimumPrice(b) - productMinimumPrice(a);
      if (sort === "rating") return b.rating - a.rating;
      return 0;
    });
  }, [activeCategory, liveProducts, query, sort]);

  const subtotal = cart.reduce((total, line) => total + productPriceForSize(line.product, line.size) * line.quantity, 0);
  // Delivery fees and taxes are not quoted until the supplied Kenyan/international
  // address is reviewed. Do not present guessed amounts as a payment total.
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;
  const cartCount = cart.reduce((totalQuantity, line) => totalQuantity + line.quantity, 0);
  const isHomePage = Boolean(featuredProductLimit);
  const isShopPage = !isHomePage;
  const displayedProducts = featuredProductLimit ? filteredProducts.slice(0, featuredProductLimit) : filteredProducts;

  function addToCart(product: Product, quantity = 1, size = product.sizes[0]) {
    addSharedCart(product, size, quantity);
    openSharedCart();
  }

  function toggleWishlist(productId: string) {
    setWishlist((current) => {
      const next = current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId];
      window.localStorage.setItem("sheaWellnessWishlist", JSON.stringify(next));
      return next;
    });
  }

  function updateLine(index: number, quantity: number) {
    setCart((lines) => {
      if (quantity <= 0) return lines.filter((_, lineIndex) => lineIndex !== index);
      return lines.map((line, lineIndex) => (lineIndex === index ? { ...line, quantity: Math.min(quantity, Math.max(1, line.product.inventoryQty)) } : line));
    });
  }

  async function placeOrder() {
    if (!cart.length || placingOrder) return;

    setPlacingOrder(true);
    setCheckoutError("");
    const requestId = checkoutRequestId.current ?? (globalThis.crypto?.randomUUID?.() ?? `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    checkoutRequestId.current = requestId;

    try {
      const response = await fetch("/api/storefront/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          customer: checkoutForm,
          // Product titles, prices, delivery, tax, and totals are calculated again
          // by the server. These client values are only a request for product IDs,
          // selected options, and quantities.
          items: cart.map((line) => ({
            productId: line.product.id,
            title: line.product.title,
            quantity: line.quantity,
            size: line.size,
            unitPrice: productPriceForSize(line.product, line.size)
          })),
          totals: { subtotal, shipping, tax, total }
        })
      });
      const payload = await response.json().catch(() => null) as {
        data?: {
          orderNumber: string;
          itemCount: number;
          items: Array<{ productId: string; title: string; size: string; quantity: number; unitPrice: number }>;
          total: number;
          paymentStatus: string;
          fulfillmentStatus: string;
          placedAt: string;
        };
        error?: string;
      } | null;
      if (!response.ok || !payload?.data?.orderNumber) {
        throw new Error(payload?.error ?? "We could not save your order. Please try again.");
      }

      const savedOrder = payload.data;
      const savedOrders = readStoredArray("sheaWellnessOrders");
      window.localStorage.setItem("sheaWellnessOrders", JSON.stringify([
        {
          source: "shea_storefront_checkout",
          orderNumber: savedOrder.orderNumber,
          customerName: checkoutForm.fullName,
          customerEmail: checkoutForm.email,
          itemCount: savedOrder.itemCount,
          totalPrice: savedOrder.total,
          items: savedOrder.items.map((item) => {
            const product = cart.find((line) => line.product.id === item.productId)?.product;
            return {
              ...item,
              imageUrl: product?.sizeMedia?.[item.size]?.imageUrl ?? product?.imageUrl ?? "",
              price: item.unitPrice
            };
          }),
          createdAt: savedOrder.placedAt,
          paymentStatus: savedOrder.paymentStatus,
          fulfillmentStatus: savedOrder.fulfillmentStatus
        },
        ...savedOrders
      ]));
      setOrderNumber(savedOrder.orderNumber);
      setCheckoutStep("success");
      setCart([]);
      checkoutRequestId.current = null;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "We could not save your order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  function getProductReviews(productId: string) {
    return reviews.filter((review) => review.productId === productId);
  }

  function viewProduct(productId: string) {
    window.location.assign(`/products/${encodeURIComponent(productId)}`);
  }

  if (cartOnly) return (<>
      <nav className="commerce-mobile-tabs" aria-label="Mobile storefront navigation">
        <a href="/"><Home size={20} /><span>Home</span></a>
        <a href="/shop"><Grid2X2 size={20} /><span>Shop</span></a>
        <button type="button" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={20} />
          <span>Cart</span>
          <b>{cartCount}</b>
        </button>
        <button type="button" onClick={() => {
          setCheckoutOpen(true);
          setCheckoutStep("information");
          setCheckoutError("");
          checkoutRequestId.current = null;
        }} disabled={cart.length === 0}>
          <CreditCard size={20} />
          <span>Checkout</span>
        </button>
      </nav>

      {cartOpen && <button type="button" className="shea-cart-scrim" onClick={() => setCartOpen(false)} aria-label="Close shopping cart" />}
      <CartDrawer
        cart={cart}
        open={cartOpen}
        currency={store.currency}
        subtotal={subtotal}
        onClose={() => setCartOpen(false)}
        onUpdate={updateLine}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
          setCheckoutStep("information");
          setCheckoutError("");
          checkoutRequestId.current = null;
        }}
      />

      {checkoutOpen ? (
        <CheckoutFlow
          step={checkoutStep}
          setStep={setCheckoutStep}
          form={checkoutForm}
          setForm={setCheckoutForm}
          cart={cart}
          subtotal={subtotal}
          shipping={shipping}
          tax={tax}
          total={total}
          currency={store.currency}
          orderNumber={orderNumber}
          error={checkoutError}
          placingOrder={placingOrder}
          onClose={() => setCheckoutOpen(false)}
          onPlaceOrder={placeOrder}
        />
      ) : null}
    </>);

  return (
    <main className="commerce-site">

      {isHomePage ? (
        <>
          <CampaignCarousel slides={heroSlides} />
          <section className="commerce-brand-intro" aria-labelledby="shea-intro-heading">
            <span>Welcome to Shea Wellness</span>
            <h2 id="shea-intro-heading">Healthy skin begins with nature.</h2>
            <p>
              Shea Wellness believes healthy skin begins with nature. Our carefully crafted products combine the
              nourishing power of pure shea butter, botanical oils, and natural plant extracts to restore moisture,
              protect your skin&apos;s natural barrier, and reveal soft, radiant skin every day.
            </p>
          </section>

          <section className="commerce-our-story" aria-labelledby="our-story-heading">
            <div className="commerce-story-visual">
              <StorefrontImage src="" alt="Community story" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              <span>Rooted in African botanical heritage</span>
            </div>
            <div className="commerce-story-copy">
              <span>Our story</span>
              <h2 id="our-story-heading">Nurturing Wellness. Empowering Communities. Sustaining Nature.</h2>
              <p>
                At Shea Wellness Ltd, we believe that wellness is more than skincare—it&apos;s a way of living. Our
                journey began with a simple yet powerful vision: to create natural, effective, and sustainable
                personal care products that nourish people while creating lasting value for communities and the environment.
              </p>
              <p>
                Inspired by Africa&apos;s rich botanical heritage, we harness the remarkable benefits of premium shea
                butter, cold-pressed plant oils, and carefully selected essential oils to craft products that care
                for the skin, hair, and overall wellbeing of the whole family.
              </p>
              <p>Every product we make reflects our commitment to purity, quality, and intentional craftsmanship. We believe that what you put on your body matters just as much as what you put into it.</p>
              <a href="/about">Discover our full story <ArrowRight size={17} /></a>
            </div>
          </section>

          <section className="commerce-service-strip" aria-label="Store benefits">
            <span><Truck size={18} /> Export-ready packaging</span>
            <span><RotateCcw size={18} /> Wholesale support</span>
            <span><ShieldCheck size={18} /> Paraben and sulfate free</span>
            <span><Star size={18} /> Handmade wellness products</span>
          </section>

          {wellnessGuidesEnabled ? <section className="commerce-document-feature" aria-labelledby="wellness-edit-heading">
            <div className="commerce-document-intro">
              <span>New complete care library</span>
              <h2 id="wellness-edit-heading">Wellness for every skin, every hair type, and every home.</h2>
              <p>
                Discover complete morning and evening routines, product benefits, step-by-step directions,
                lifestyle guidance, safety notes, and realistic results for consistent use.
              </p>
              <a href="/wellness-guides">Read all six wellness guides <ArrowRight size={18} /></a>
            </div>
            <div className="commerce-document-guide-grid">
              {concernCards.map((guide, index) => (
                <a href={guide.href} key={guide.title}>
                  <span>0{index + 1}</span>
                  <StorefrontImage src={ownerAsset(ownerRoutineImages[guide.href.split("#")[1]].front)} alt="" loading="lazy" decoding="async" />
                  <div><strong>{guide.title}</strong><small>{guide.body}</small></div>
                  <ArrowRight size={18} />
                </a>
              ))}
            </div>
          </section> : null}

          <section className="commerce-video-section" id="product-films">
            <div className="commerce-section-title split">
              <div>
                <span>Product films</span>
                <h2>Real Shea Wellness product videos.</h2>
                <p className="commerce-shop-intro">Inspect product texture, packaging, and retail presentation in motion.</p>
              </div>
              <a href="/catalogue">View media catalogue <ArrowRight size={17} /></a>
            </div>
            <div className="commerce-video-slider" aria-label="Shea Wellness product video slider">
              {mediaVideos.slice(0, 4).map((video) => (
                <article key={video.src}>
                  <video src={video.src} poster={video.src.startsWith("/assets/owner-oct-2026/") ? video.src.replace(".mp4", "-poster.webp") : undefined} controls playsInline preload="none" />
                  <strong>{video.title}</strong>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <section className={clsx("commerce-products-section", isShopPage && "shop-only")} id="products">
        <div className="commerce-section-title split">
          <div>
            <span>{isHomePage ? "Products" : "Catalogue"}</span>
            <h2>{isHomePage ? "Featured products." : "Shop the collection."}</h2>
            <p className="commerce-shop-intro">
              {isHomePage
                ? "Pure Nilotica shea, gentle cleansers and botanical essentials for your daily ritual."
                : "Browse every active product in the Shea Wellness catalogue."}
            </p>
          </div>
          <div className="commerce-controls">
            {isHomePage ? (
              <a className="commerce-full-shop-link" href="/shop">View full shop <ArrowRight size={17} /></a>
            ) : (
              <label>
              <SlidersHorizontal size={17} />
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="rating">Top rated</option>
                <option value="price-low">Price low to high</option>
                <option value="price-high">Price high to low</option>
              </select>
              <ChevronDown size={16} />
              </label>
            )}
          </div>
        </div>

        {isShopPage ? (
        <div className="commerce-filter-row commerce-category-nav">
          {categories.map((category) => (
            <a
              key={category}
              className={clsx(activeCategory === category && "active")}
              href={category === "All" ? "/shop" : `/collections/${categoryToSlug(category)}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </a>
          ))}
        </div>
        ) : null}

        <div className="commerce-product-grid">
          {displayedProducts.map(product => <ProductCard key={product.id} product={product} currency={store.currency} wished={wishlist.includes(product.id)} onWishlist={() => toggleWishlist(product.id)} />)}
        </div>
      </section>

      {isHomePage ? (
      <>
      <section className="beauty-routine-banner"><div><span>Your everyday ritual</span><h2>Cleanse. Nourish. Glow.</h2><p>Build a simple routine with care for your skin, hair and moments of calm.</p></div><a href="/wellness-guides">Find your routine <ArrowRight size={18} /></a></section>

      <section className="commerce-concerns-section" id="skin-concerns">
        <div className="commerce-section-title split">
          <div>
            <span>Shop by concern</span>
            <h2>Find a Shea Wellness routine by skin and care need.</h2>
          </div>
          <p className="commerce-shop-intro">A cleaner path for customers who do not know the exact product name yet.</p>
        </div>
        <div className="commerce-concern-grid">
          {concernCards.map((concern) => (
            <a href={concern.href} key={concern.title}>
              <StorefrontImage src={ownerAsset(ownerRoutineImages[concern.href.split("#")[1]].front)} alt={concern.title} loading="lazy" />
              <i />
              <strong>{concern.title}</strong>
              <span>{concern.body}</span>
              <b>View routine &amp; products</b>
            </a>
          ))}
        </div>
      </section>

      <section className="commerce-seen-strip" aria-label="Shea Wellness partners">
        <span>Our partners</span>
        <OwnerPartners media={mediaConfig} />
      </section>

      <section className="commerce-guarantee-strip" aria-label="Store assurances">
        <span><CheckCircle2 size={19} /> Natural ingredients</span>
        <span><CheckCircle2 size={19} /> Ethical Nilotica shea</span>
        <span><CheckCircle2 size={19} /> Export-ready quality</span>
      </section>

      <OwnerRoutineProgress media={mediaConfig} />

      <section className="commerce-comparison-section">
        <div className="commerce-comparison-copy">
          <span>Compare</span>
          <h2>Shea Wellness versus others.</h2>
          <p>Clear reasons to choose a focused Nilotica shea wellness brand over other skincare options.</p>
        </div>
        <div className="commerce-comparison-table" role="table" aria-label="Shea Wellness comparison">
          <div role="row">
            <strong role="columnheader">Standard</strong>
            <strong role="columnheader">Shea Wellness</strong>
            <strong role="columnheader">Others</strong>
          </div>
          {comparisonRows.map(([label, shea, generic]) => (
            <div role="row" key={label}>
              <span role="cell">{label}</span>
              <span role="cell">{shea ? <CheckCircle2 size={21} /> : <X size={21} />}</span>
              <span role="cell">{generic ? <CheckCircle2 size={21} /> : <X size={21} />}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="commerce-editorial" id="wholesale">
        <div>
          <span>Wholesale and distributors</span>
          <h2>Private label, export-ready packaging, and competitive wholesale pricing.</h2>
        </div>
        <p>
          Built for international retailers, wellness spas, organic beauty stores, and distributors who need authentic
          Nilotica shea products with reliable fulfilment and premium product presentation.
        </p>
      </section>

      <section className="commerce-social-proof">
        <div className="commerce-section-title">
          <span>Why Shea Wellness</span>
          <h2>Clean formulations, ethical sourcing, and African heritage in every routine.</h2>
        </div>
        <div className="commerce-proof-grid">
          {[
            { value: "100%", detail: "Natural, paraben-free and sulfate-free positioning." },
            { value: "@shea", detail: "Follow @sheawellnesske for routines and product updates.", href: "https://www.instagram.com/sheawellnesske/" },
            { value: "KAM", detail: "Expo participation with wellness retail visibility." },
            { value: "Nairobi", detail: "Westlands support for retail and distributor enquiries." }
          ].map(({ value, detail, href }) => (
            <article key={value}>
              <strong>{value}</strong>
              <p>{detail}</p>
              {href ? <a href={href} target="_blank" rel="noreferrer">View Instagram</a> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="commerce-home-faq">
        <header><span>Quick answers</span><h2>Good to know before you begin.</h2><p>Product, routine, sourcing and delivery guidance from Shea Wellness.</p></header>
        <div>{quickFaqs.slice(0, 6).map(([question, answer]) => <details key={question}><summary>{question}<i>+</i></summary><p>{answer}</p></details>)}</div>
        <a href="/faq">Explore all FAQs <ArrowRight size={17} /></a>
      </section>

      <section className="commerce-newsletter">
        <figure className="commerce-newsletter-media">
          <StorefrontImage src="/assets/sheawellness/grapefruit-shea-butter-front.jpeg" alt="Shea Wellness grapefruit body and face butter" />
        </figure>
        <div>
          <span>Wellness education</span>
          <h2>Get skincare routines, distributor updates, and product launches.</h2>
          <p>Join the Shea Wellness list for new butter infusions, wholesale availability, and skincare education rooted in natural Nilotica shea.</p>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <input type="email" placeholder="Email address" aria-label="Email address" />
          <button type="button">Join</button>
        </form>
      </section>
      </>
      ) : null}

      <SheaTrustGrid />
      <SheaCommerceFooter />
      <SheaWhatsApp />

    </main>
  );
}

function CartDrawer({
  cart,
  open,
  currency,
  subtotal,
  onClose,
  onUpdate,
  onCheckout
}: {
  cart: CartLine[];
  open: boolean;
  currency: string;
  subtotal: number;
  onClose: () => void;
  onUpdate: (index: number, quantity: number) => void;
  onCheckout: () => void;
}) {
  return (
    <aside className={clsx("commerce-drawer", open && "open")} role="dialog" aria-label="Shopping cart" aria-modal={open ? true : undefined} aria-hidden={!open} inert={!open}>
      <div className="commerce-drawer-head">
        <div>
          <span>Shopping cart</span>
          <strong>{cart.length} line items</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Close cart">
          <X size={20} />
        </button>
      </div>
      <div className="commerce-cart-lines">
        {cart.length === 0 ? <p>Your cart is ready for Shea Wellness products.</p> : null}
        {cart.map((line, index) => (
          <article className={isSidewaysSheaProductAsset(line.product.imageUrl) ? "is-rotated" : undefined} key={`${line.product.id}-${line.size}`}>
            <StorefrontImage className={isSidewaysSheaProductAsset(line.product.sizeMedia?.[line.size]?.imageUrl ?? line.product.imageUrl) ? "shea-rotated-product-image" : undefined} src={line.product.sizeMedia?.[line.size]?.imageUrl ?? line.product.imageUrl} alt={line.product.title} style={{ objectPosition: line.product.imagePosition }} />
            <div>
              <strong>{line.product.title}</strong>
              <span>{line.size}</span>
              <b>{formatMoney(productPriceForSize(line.product, line.size), currency)}</b>
              <div className="commerce-qty">
                <button type="button" onClick={() => onUpdate(index, line.quantity - 1)}><Minus size={14} /></button>
                <span>{line.quantity}</span>
                <button type="button" onClick={() => onUpdate(index, line.quantity + 1)}><Plus size={14} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="commerce-cart-summary">
        <div><span>Subtotal</span><strong>{formatMoney(subtotal, currency)}</strong></div>
        <small>Shipping, duties, and tax are confirmed during checkout.</small>
        <button type="button" disabled={cart.length === 0} onClick={onCheckout}>Checkout</button>
      </div>
    </aside>
  );
}

function ProductModal({
  product,
  currency,
  focusReview,
  onClose,
  reviews,
  onReviewSubmit,
  onAdd
}: {
  product: Product;
  currency: string;
  focusReview: boolean;
  onClose: () => void;
  reviews: ProductReview[];
  onReviewSubmit: (review: ProductReview) => void;
  onAdd: (product: Product, size: string) => void;
}) {
  const [size, setSize] = useState(product.sizes[0]);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const reviewFormRef = useRef<HTMLFormElement | null>(null);
  const averageRating = reviews.length
    ? reviews.reduce((totalRating, review) => totalRating + review.rating, 0) / reviews.length
    : 0;

  function submitProductReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewName.trim() || !reviewBody.trim()) return;
    onReviewSubmit({
      productId: product.id,
      source: "shea_storefront_review",
      name: reviewName.trim(),
      rating: reviewRating,
      body: reviewBody.trim(),
      createdAt: new Date().toISOString()
    });
    setReviewName("");
    setReviewRating(5);
    setReviewBody("");
  }

  useEffect(() => {
    if (!focusReview) return;
    window.setTimeout(() => {
      reviewFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      reviewFormRef.current?.querySelector("input")?.focus();
    }, 120);
  }, [focusReview]);

  return (
    <div className="commerce-modal-backdrop">
      <section className="commerce-product-modal">
        <button type="button" className="commerce-close" onClick={onClose} aria-label="Close product">
          <X size={20} />
        </button>
        <div className={clsx("commerce-modal-media", isSidewaysSheaProductAsset(product.imageUrl) && "is-rotated")}>
          <StorefrontImage className={isSidewaysSheaProductAsset(product.imageUrl) ? "shea-rotated-product-image" : undefined} src={product.imageUrl} alt={product.title} style={{ objectPosition: product.imagePosition }} />
        </div>
        <div className="commerce-modal-copy">
          <h2>{product.title}</h2>
          <div className="commerce-rating">
            <span><Star size={14} fill="currentColor" /> {reviews.length ? averageRating.toFixed(1) : "New"}</span>
            <small>{reviews.length ? `${reviews.length} customer reviews` : "No customer reviews yet"}</small>
          </div>
          <p>{product.description}</p>
          <dl>
            <div><dt>Material</dt><dd>{product.material}</dd></div>
            <div><dt>Delivery</dt><dd>{product.deliveryBadge}</dd></div>
            <div><dt>Care</dt><dd>Store in a cool, dry place away from direct sunlight</dd></div>
          </dl>
          <fieldset>
            <legend>Size</legend>
            {product.sizes.map((item) => (
              <button type="button" className={clsx(size === item && "active")} key={item} onClick={() => setSize(item)}>{item}</button>
            ))}
          </fieldset>
          <div className="commerce-modal-buy">
            <strong>{formatMoney(productPriceForSize(product, size), currency)}</strong>
            <button type="button" onClick={() => onAdd(product, size)}>
              <ShoppingCart size={18} />
              Add to cart
            </button>
          </div>
          <section className="commerce-review-panel">
            <h3>Customer reviews</h3>
            {reviews.length ? (
              <div className="commerce-review-list">
                {reviews.slice(0, 3).map((review) => (
                  <article key={`${review.productId}-${review.createdAt}`}>
                    <strong>{review.name}</strong>
                    <span><Star size={13} fill="currentColor" /> {review.rating}/5</span>
                    <p>{review.body}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="commerce-review-empty">No customer reviews have been submitted for this product yet.</p>
            )}
            <form className="commerce-review-form" ref={reviewFormRef} onSubmit={submitProductReview}>
              <input value={reviewName} onChange={(event) => setReviewName(event.target.value)} placeholder="Your name" aria-label="Your name" />
              <select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))} aria-label="Rating">
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
              </select>
              <textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} placeholder="Share your product experience" aria-label="Review" />
              <button type="submit">Submit review</button>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}

function CheckoutFlow({
  step,
  setStep,
  form,
  setForm,
  cart,
  subtotal,
  shipping,
  tax,
  total,
  currency,
  orderNumber,
  error,
  placingOrder,
  onClose,
  onPlaceOrder
}: {
  step: CheckoutStep;
  setStep: (step: CheckoutStep) => void;
  form: CheckoutForm;
  setForm: (form: CheckoutForm) => void;
  cart: CartLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  orderNumber: string;
  error: string;
  placingOrder: boolean;
  onClose: () => void;
  onPlaceOrder: () => Promise<void>;
}) {
  const steps: CheckoutStep[] = ["information", "delivery", "payment", "review"];
  const canProceed = step !== "information" || Boolean(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && form.fullName.trim().length >= 2 && form.phone.trim().length >= 6 && form.address.trim().length >= 4 && form.country.trim().length >= 2 && form.city.trim().length >= 2);

  return (
    <div className="commerce-checkout-backdrop">
      <section className="commerce-checkout">
        <button type="button" className="commerce-close" onClick={onClose} aria-label="Close checkout">
          <X size={20} />
        </button>
        <div className="commerce-checkout-main">
          {step === "success" ? (
            <div className="commerce-success">
              <CheckCircle2 size={44} />
              <span>Order request received</span>
              <h2>{orderNumber}</h2>
              <p>Shea Wellness will confirm delivery and payment details before fulfilment. No online payment has been collected by this storefront yet.</p>
              <button type="button" onClick={onClose}>Return to store</button>
            </div>
          ) : (
            <>
              <div className="commerce-checkout-steps">
                {steps.map((item) => (
                  <button type="button" key={item} className={clsx(step === item && "active")} onClick={() => setStep(item)}>
                    {item}
                  </button>
                ))}
              </div>
              {step === "information" ? (
                <CheckoutInformation form={form} setForm={setForm} />
              ) : null}
              {step === "delivery" ? (
                <CheckoutDelivery form={form} setForm={setForm} />
              ) : null}
              {step === "payment" ? (
                <CheckoutPayment form={form} setForm={setForm} />
              ) : null}
              {step === "review" ? (
                <CheckoutReview form={form} cart={cart} currency={currency} total={total} />
              ) : null}
              {error ? <p className="commerce-checkout-error" role="alert">{error}</p> : null}
              <div className="commerce-checkout-actions">
                <button type="button" className="secondary" disabled={placingOrder} onClick={() => {
                  const index = steps.indexOf(step);
                  setStep(index <= 0 ? "information" : steps[index - 1]);
                }}>Back</button>
                {step === "review" ? (
                  <button type="button" disabled={placingOrder} onClick={onPlaceOrder}>{placingOrder ? "Saving order…" : "Place order request"}</button>
                ) : (
                  <button type="button" disabled={!canProceed} onClick={() => setStep(steps[steps.indexOf(step) + 1])}>Continue</button>
                )}
              </div>
            </>
          )}
        </div>
        <aside className="commerce-checkout-summary">
          <h3>Order summary</h3>
          {cart.map((line) => (
            <div className="commerce-summary-line" key={`${line.product.id}-${line.size}`}>
              <span>{line.quantity}x {line.product.title}</span>
              <strong>{formatMoney(productPriceForSize(line.product, line.size) * line.quantity, currency)}</strong>
            </div>
          ))}
          <div><span>Subtotal</span><strong>{formatMoney(subtotal, currency)}</strong></div>
          <div><span>Delivery</span><strong>Address review</strong></div>
          <div><span>Taxes</span><strong>Confirmed before payment</strong></div>
          <div className="total"><span>Products subtotal</span><strong>{formatMoney(total, currency)}</strong></div>
        </aside>
      </section>
    </div>
  );
}

function CheckoutInformation({ form, setForm }: { form: CheckoutForm; setForm: (form: CheckoutForm) => void }) {
  return (
    <div className="commerce-checkout-panel">
      <span>Guest checkout</span>
      <h2>Contact and delivery address</h2>
      <label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
      <label>Full name<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Customer name" /></label>
      <label>Phone number<input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+254 7xx xxx xxx" /></label>
      <label>Address<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Street address" /></label>
      <div className="commerce-form-row">
        <label>Country<input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} placeholder="Kenya" /></label>
        <label>City / county / province<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Nairobi, Mombasa, Kisumu..." /></label>
      </div>
    </div>
  );
}

function CheckoutDelivery({ form, setForm }: { form: CheckoutForm; setForm: (form: CheckoutForm) => void }) {
  return (
    <div className="commerce-checkout-panel">
      <span>Delivery</span>
      <h2>Choose where we deliver</h2>
      {[
        { id: "kenya", title: "Kenya delivery", detail: "Nairobi and other Kenyan destinations. The delivery route, fee, and any free-delivery eligibility are confirmed from your address." },
        { id: "international", title: "Outside Kenya", detail: "International delivery is available by quotation after your address and order are reviewed." }
      ].map((method) => (
        <button
          type="button"
          className={clsx("commerce-option", form.deliveryMethod === method.id && "active")}
          key={method.id}
          onClick={() => setForm({ ...form, deliveryMethod: method.id as CheckoutForm["deliveryMethod"] })}
        >
          <span><strong>{method.title}</strong><small>{method.detail}</small></span>
          <b>Address review</b>
        </button>
      ))}
    </div>
  );
}

function CheckoutPayment({ form, setForm }: { form: CheckoutForm; setForm: (form: CheckoutForm) => void }) {
  return (
    <div className="commerce-checkout-panel">
      <span>Payment preference</span>
      <h2>How should Shea Wellness contact you to arrange payment?</h2>
      {[
        { id: "card", title: "Credit or debit card", detail: "A secure payment link is sent after stock and delivery are confirmed.", icon: CreditCard },
        { id: "paypal", title: "PayPal", detail: "PayPal instructions are sent after the order is reviewed.", icon: ShieldCheck },
        { id: "mpesa", title: "M-Pesa", detail: "A payment prompt or verified PayBill instructions are provided after order review.", icon: ShoppingCart }
      ].map((method) => {
        const Icon = method.icon;
        return (
          <button
            type="button"
            className={clsx("commerce-option", form.paymentMethod === method.id && "active")}
            key={method.id}
            onClick={() => setForm({ ...form, paymentMethod: method.id as CheckoutForm["paymentMethod"] })}
          >
            <span><Icon size={18} /><strong>{method.title}</strong><small>{method.detail}</small></span>
          </button>
        );
      })}
    </div>
  );
}

function CheckoutReview({
  form,
  cart,
  currency,
  total
}: {
  form: CheckoutForm;
  cart: CartLine[];
  currency: string;
  total: number;
}) {
  return (
    <div className="commerce-checkout-panel">
      <span>Review</span>
      <h2>Confirm your order request</h2>
      <div className="commerce-review-box">
        <strong>{form.fullName}</strong>
        <p>{form.email}</p>
        <p>{form.phone}</p>
        <p>{form.address}, {form.city}, {form.country}</p>
        <p>{form.deliveryMethod === "international" ? "International delivery quote" : "Kenya delivery"} / {form.paymentMethod === "card" ? "Card" : form.paymentMethod === "paypal" ? "PayPal" : "M-Pesa"}</p>
      </div>
      <div className="commerce-review-box">
        <strong>{cart.length} line items</strong>
        <p>Products subtotal: {formatMoney(total, currency)}. Delivery, tax, and payment confirmation follow address review. No payment is collected in this step.</p>
      </div>
    </div>
  );
}
