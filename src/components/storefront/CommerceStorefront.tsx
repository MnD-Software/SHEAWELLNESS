"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Eye,
  Grid2X2,
  Home,
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
import { formatMoney } from "@/lib/format";
import { categoryToSlug } from "@/lib/product-routing";
import { sheaDefaultMediaConfig, type SheaMediaConfig } from "@/lib/shea-content";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";
import type { Product, Store } from "@/lib/types";

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
  address: string;
  city: string;
  postalCode: string;
  deliveryMethod: "standard" | "express";
  paymentMethod: "card" | "paypal";
};

const defaultForm: CheckoutForm = {
  email: "",
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  deliveryMethod: "standard",
  paymentMethod: "card"
};

const concernCards = [
  {
    title: "Dry & flaky skin",
    body: "Cleanse gently, replenish lost moisture, and seal comfort into rough or flaky patches.",
    image: "/assets/sheawellness/pure-raw-shea-butter.jpeg",
    href: "/shop?search=vanilla"
  },
  {
    title: "Sensitive skin comfort",
    body: "Barrier-first care with African black soap, lavender shea butter, and patch-test guidance.",
    image: "/assets/sheawellness/lavender-shea-butter-front.jpeg",
    href: "/shop?search=lavender"
  },
  {
    title: "Fresh body glow",
    body: "Refresh, moisturize, and finish with body oil for softer, naturally radiant skin.",
    image: "/assets/WhatsApp Image 2026-07-08 at 12.44.29 (3).jpeg",
    href: "/shop?search=grapefruit"
  },
  {
    title: "Face care routine",
    body: "A simple three-step routine: cleanse, nourish, and protect by day; restore by night.",
    image: "/assets/sheawellness/face-care-routine.png",
    href: "/shop?search=face"
  },
  {
    title: "Hair & scalp moisture",
    body: "Clean scalp care, castor oil moisture, and rosemary scalp-massage support.",
    image: "/assets/WhatsApp Image 2026-07-08 at 12.44.27 (1).jpeg",
    href: "/shop?search=hair"
  },
  {
    title: "Spa essentials",
    body: "Essential oils, diffusers, humidifiers, and treatment-room supplies for wellness spaces.",
    image: "/assets/sheawellness/lavender-shea-butter-back.jpeg",
    href: "/wholesale"
  }
];

const comparisonRows = [
  ["100% Natural", true, false],
  ["No Harsh Chemicals", true, false],
  ["Supports Skin Barrier", true, false],
  ["Suitable for Sensitive Skin", true, false],
  ["Routine Education Included", true, false]
] as const;

const beforeAfterSlides = [
  {
    title: "Shea Wellness face care routine",
    image: "/assets/sheawellness/face-care-routine.png",
    labels: ["Morning", "Evening"]
  },
  {
    title: "Body tone progress",
    image: "/assets/WhatsApp Image 2026-07-08 at 12.04.41.jpeg",
    labels: ["Before", "After"]
  },
  {
    title: "Skin clarity progress",
    image: "/assets/WhatsApp Image 2026-07-08 at 12.03.58.jpeg",
    labels: ["Before", "After"]
  },
  {
    title: "Moisture glow progress",
    image: "/assets/WhatsApp Image 2026-07-08 at 12.44.30 (3).jpeg",
    labels: ["Before", "After"]
  }
];

const faceRoutineSteps = [
  {
    title: "Morning routine",
    promise: "Cleanse. Nourish. Protect.",
    steps: [
      "Cleanse with African Liquid Black Soap and lukewarm water.",
      "Apply 2-4 drops of Rosehip Facial Oil while skin is slightly damp.",
      "Finish with broad-spectrum sunscreen before daily sun exposure."
    ]
  },
  {
    title: "Evening routine",
    promise: "Cleanse. Nourish. Restore.",
    steps: [
      "Cleanse again with African Liquid Black Soap using gentle circular motions.",
      "Massage facial oil into clean skin and neck.",
      "Seal dry areas with a light layer of Lavender Shea Butter where needed."
    ]
  }
];

const routineSupportLists = [
  ["Suitable for", "Dry skin", "Normal skin", "Combination skin", "Mature skin", "Sensitive skin after patch test"],
  ["What to expect", "Cleaner refreshed skin", "Better hydration", "Softer smoother feel", "Healthy natural glow", "Stronger moisture barrier"],
  ["Best results", "Use morning and night", "Drink plenty of water", "Wear sunscreen daily", "Patch test new products"]
];

export function CommerceStorefront({
  store,
  products,
  initialSearch = "",
  featuredProductLimit
}: {
  store: Store;
  products: Product[];
  initialSearch?: string;
  featuredProductLimit?: number;
}) {
  const [catalogProducts, setCatalogProducts] = useState(products);
  const liveProducts = catalogProducts.filter((product) => product.status === "active" || product.status === "low_stock");
  const categories = ["All", ...Array.from(new Set(liveProducts.map((product) => product.category)))];
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState(initialSearch);
  const [sort, setSort] = useState("featured");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("information");
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(defaultForm);
  const [orderNumber, setOrderNumber] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [mediaConfig, setMediaConfig] = useState<SheaMediaConfig>(sheaDefaultMediaConfig);

  const heroSlides = mediaConfig.heroSlides.length ? mediaConfig.heroSlides : sheaDefaultMediaConfig.heroSlides;
  const heroSlide = heroSlides[heroIndex] ?? heroSlides[0];
  const mediaVideos = mediaConfig.videos.length ? mediaConfig.videos : sheaDefaultMediaConfig.videos;

  function moveHero(direction: 1 | -1) {
    if (heroSlides.length < 2) return;
    setHeroIndex((index) => (index + direction + heroSlides.length) % heroSlides.length);
  }

  useEffect(() => {
    const savedMedia = window.localStorage.getItem("sheaWellnessMediaConfig");
    if (!savedMedia) return;

    try {
      const parsedMedia = JSON.parse(savedMedia) as SheaMediaConfig;
      if (Array.isArray(parsedMedia.heroSlides) && Array.isArray(parsedMedia.images) && Array.isArray(parsedMedia.videos)) {
        setMediaConfig(parsedMedia);
      }
    } catch {
      setMediaConfig(sheaDefaultMediaConfig);
    }
  }, []);

  useEffect(() => {
    const savedProducts = window.localStorage.getItem("sheaWellnessProducts");
    if (!savedProducts) return;

    try {
      const parsedProducts = JSON.parse(savedProducts) as Product[];
      if (Array.isArray(parsedProducts) && parsedProducts.length) {
        setCatalogProducts(parsedProducts);
      }
    } catch {
      setCatalogProducts(products);
    }
  }, [products]);

  useEffect(() => {
    const savedCart = window.localStorage.getItem("sheaWellnessCart");
    if (!savedCart) {
      setCartHydrated(true);
      return;
    }

    try {
      const parsedCart = JSON.parse(savedCart) as StoredCartLine[];
      const nextCart = parsedCart
        .map((line) => {
          const product = catalogProducts.find((item) => item.id === line.productId);
          return product ? { product, size: line.size, quantity: line.quantity } : null;
        })
        .filter((line): line is CartLine => Boolean(line));
      setCart(nextCart);
    } catch {
      setCart([]);
    } finally {
      setCartHydrated(true);
    }
  }, [catalogProducts]);

  useEffect(() => {
    if (!cartHydrated) return;
    window.localStorage.setItem("sheaWellnessCart", JSON.stringify(cart.map((line) => ({
      productId: line.product.id,
      title: line.product.title,
      imageUrl: line.product.imageUrl,
      price: line.product.price,
      size: line.size,
      quantity: line.quantity
    } satisfies StoredCartLine))));
  }, [cart, cartHydrated]);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % heroSlides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const savedReviews = window.localStorage.getItem("sheaWellnessReviews");
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews) as ProductReview[]);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    const nextProducts = liveProducts.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const term = `${product.title} ${product.description} ${product.category}`.toLowerCase();
      const matchesQuery = !query.trim() || term.includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });

    return [...nextProducts].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return b.sales - a.sales;
    });
  }, [activeCategory, liveProducts, query, sort]);

  const subtotal = cart.reduce((total, line) => total + line.product.price * line.quantity, 0);
  const shipping = subtotal > 15000 || subtotal === 0 ? 0 : checkoutForm.deliveryMethod === "express" ? 900 : 450;
  const tax = subtotal * 0.16;
  const total = subtotal + shipping + tax;
  const cartCount = cart.reduce((totalQuantity, line) => totalQuantity + line.quantity, 0);
  const isHomePage = Boolean(featuredProductLimit);
  const isShopPage = !isHomePage;
  const displayedProducts = featuredProductLimit ? filteredProducts.slice(0, featuredProductLimit) : filteredProducts;

  function addToCart(product: Product, quantity = 1, size = product.sizes[0]) {
    setCart((lines) => {
      const existingIndex = lines.findIndex((line) => line.product.id === product.id && line.size === size);
      if (existingIndex === -1) {
        return [...lines, { product, quantity, size }];
      }
      return lines.map((line, index) => (index === existingIndex ? { ...line, quantity: line.quantity + quantity } : line));
    });
    setCartOpen(true);
  }

  function updateLine(index: number, quantity: number) {
    setCart((lines) => {
      if (quantity <= 0) return lines.filter((_, lineIndex) => lineIndex !== index);
      return lines.map((line, lineIndex) => (lineIndex === index ? { ...line, quantity } : line));
    });
  }

  async function placeOrder() {
    const response = await fetch("/api/storefront/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: checkoutForm,
        items: cart.map((line) => ({
          productId: line.product.id,
          title: line.product.title,
          quantity: line.quantity,
          size: line.size,
          unitPrice: line.product.price
        })),
        totals: { subtotal, shipping, tax, total }
      })
    });

    const payload = (await response.json()) as { data?: { orderNumber: string } };
    const nextOrderNumber = payload.data?.orderNumber ?? `SHEA-${Date.now().toString().slice(-6)}`;
    const savedOrders = JSON.parse(window.localStorage.getItem("sheaWellnessOrders") ?? "[]") as unknown[];
    window.localStorage.setItem("sheaWellnessOrders", JSON.stringify([
      {
        source: "shea_storefront_checkout",
        orderNumber: nextOrderNumber,
        customerName: checkoutForm.fullName,
        customerEmail: checkoutForm.email,
        itemCount: cart.reduce((count, line) => count + line.quantity, 0),
        totalPrice: total,
        createdAt: new Date().toISOString(),
        paymentStatus: "authorized",
        fulfillmentStatus: "unfulfilled"
      },
      ...savedOrders
    ]));
    setOrderNumber(nextOrderNumber);
    setCheckoutStep("success");
    setCart([]);
  }

  function getProductReviews(productId: string) {
    return reviews.filter((review) => review.productId === productId);
  }

  return (
    <main className="commerce-site">
      <SheaGlobalHeader cartCount={cartCount} onCartOpen={() => setCartOpen(true)} searchValue={query} onSearchChange={setQuery} />

      {isHomePage ? (
        <>
          <section className="commerce-hero" id="top">
            <div className="commerce-hero-card" aria-label="Before and after carousel">
              {heroSlide ? (
                <img src={heroSlide.src} alt={heroSlide.title} style={{ objectPosition: heroSlide.objectPosition ?? "50% 50%" }} />
              ) : (
                <img src="/assets/storefront-hero.png" alt="Curated retail products in a premium ecommerce campaign" />
              )}
              <div className="commerce-hero-overlay" />

              <div className="commerce-hero-copy">
                <span>{heroSlide?.kicker ?? "Pure Nilotica Shea"}</span>
                <h1>{heroSlide?.title ?? "Modern wellness essentials"}</h1>
                {heroSlide?.body ? <p>{heroSlide.body}</p> : null}
                <div className="commerce-hero-actions">
                  {heroSlide ? <a href={heroSlide.ctaHref}>{heroSlide.ctaLabel}</a> : null}
                  <a className="ghost" href="/products">View product guide</a>
                </div>
              </div>

              {heroSlide ? (
                <div className="commerce-hero-meta">
                  <span>{heroSlide.tag}</span>
                  <strong>Before / After</strong>
                </div>
              ) : null}

              <button type="button" className="commerce-carousel-arrow previous" onClick={() => moveHero(-1)} aria-label="Previous product">
                <ArrowLeft size={20} />
              </button>
              <button type="button" className="commerce-carousel-arrow next" onClick={() => moveHero(1)} aria-label="Next product">
                <ArrowRight size={20} />
              </button>

              <div className="commerce-carousel-dots" aria-label="Choose featured product">
                {heroSlides.map((slide, index) => (
                  <button
                    type="button"
                    key={slide.id}
                    className={clsx(heroIndex === index && "active")}
                    onClick={() => setHeroIndex(index)}
                    aria-label={`Show ${slide.title}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="commerce-service-strip" aria-label="Store benefits">
            <span><Truck size={18} /> Export-ready packaging</span>
            <span><RotateCcw size={18} /> Wholesale support</span>
            <span><ShieldCheck size={18} /> Paraben and sulfate free</span>
            <span><Star size={18} /> Handmade wellness products</span>
          </section>

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
                  <video src={video.src} autoPlay muted loop playsInline preload="metadata" />
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
            <h2>{isHomePage ? "Featured products." : "All Shea Wellness products."}</h2>
            <p className="commerce-shop-intro">
              {isHomePage
                ? "A focused preview of the retail catalogue. Visit the shop for every product and category."
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
          {displayedProducts.map((product) => {
            const productReviews = getProductReviews(product.id);
            const reviewCount = productReviews.length;
            const averageRating = reviewCount
              ? productReviews.reduce((totalRating, review) => totalRating + review.rating, 0) / reviewCount
              : 0;
            return (
            <article className="commerce-product-card" key={product.id}>
              <a className="commerce-product-image" href={`/products/${encodeURIComponent(product.id)}`}>
                <img src={product.imageUrl} alt={product.title} loading="lazy" style={{ objectPosition: product.imagePosition }} />
                <b>View product</b>
              </a>
              <div className="commerce-product-body">
                <div>
                  <strong>{product.title}</strong>
                  <p>{product.description}</p>
                </div>
                <div className="commerce-rating">
                  <span><Star size={14} fill="currentColor" /> {reviewCount ? averageRating.toFixed(1) : "New"}</span>
                  <small>{reviewCount ? `${reviewCount} customer reviews` : "Be first to review"}</small>
                </div>
                <div className="commerce-price-row">
                  <span>{formatMoney(product.price, store.currency)}</span>
                </div>
                <div className="commerce-card-actions">
                  <button type="button" onClick={() => addToCart(product)}>
                    <ShoppingCart size={17} />
                    Add
                  </button>
                  <a className="secondary" href={`/products/${encodeURIComponent(product.id)}`}>
                    <Eye size={17} />
                    View
                  </a>
                  <a className="secondary review" href={`/products/${encodeURIComponent(product.id)}#reviews`}>
                    <Star size={17} />
                    Review
                  </a>
                </div>
              </div>
            </article>
          );
          })}
        </div>
      </section>

      {isHomePage ? (
      <>
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
              <img src={concern.image} alt="" loading="lazy" />
              <i />
              <strong>{concern.title}</strong>
              <span>{concern.body}</span>
              <b>Explore collection</b>
            </a>
          ))}
        </div>
      </section>

      <section className="commerce-routine-section" id="face-care-routine">
        <figure>
          <img src="/assets/sheawellness/face-care-routine.png" alt="Shea Wellness face care routine guide" loading="lazy" />
        </figure>
        <div className="commerce-routine-copy">
          <span>Face care routine</span>
          <h2>Nourish. Protect. Glow naturally.</h2>
          <p>
            Healthy, radiant skin starts with a consistent routine. Shea Wellness face care gently cleanses,
            deeply hydrates, and supports your skin's natural barrier every morning and evening.
          </p>
          <div className="commerce-routine-cards">
            {faceRoutineSteps.map((routine) => (
              <article key={routine.title}>
                <strong>{routine.title}</strong>
                <small>{routine.promise}</small>
                <ol>
                  {routine.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </article>
            ))}
          </div>
          <div className="commerce-routine-support">
            {routineSupportLists.map(([title, ...items]) => (
              <article key={title}>
                <strong>{title}</strong>
                {items.map((item) => <span key={item}><CheckCircle2 size={15} />{item}</span>)}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="commerce-seen-strip" aria-label="Shea Wellness credibility">
        <span>As trusted by</span>
        <div className="commerce-marquee-viewport">
          <div className="commerce-marquee-track">
            {["KAM Expo", "Nairobi retail", "Organic beauty stores", "Wellness spas", "Wholesale buyers", "Natural skincare buyers"].map((item) => (
              <strong key={item}>{item}</strong>
            ))}
            {["KAM Expo", "Nairobi retail", "Organic beauty stores", "Wellness spas", "Wholesale buyers", "Natural skincare buyers"].map((item) => (
              <strong key={`${item}-repeat`} aria-hidden="true">{item}</strong>
            ))}
          </div>
        </div>
      </section>

      <section className="commerce-guarantee-strip" aria-label="Store assurances">
        <span><CheckCircle2 size={19} /> Natural ingredients</span>
        <span><CheckCircle2 size={19} /> Ethical Nilotica shea</span>
        <span><CheckCircle2 size={19} /> Export-ready quality</span>
      </section>

      <section className="commerce-before-after-section" aria-label="Before and after customer results">
        <div className="commerce-before-after-proof">
          <span><CheckCircle2 size={20} /> Dermatologist tested</span>
          <span><CheckCircle2 size={20} /> Routine support</span>
          <span><CheckCircle2 size={20} /> 100% natural</span>
        </div>
        <div className="commerce-before-after-head">
          <div>
            <span>Before and after</span>
            <h2>Real skin routine progress.</h2>
          </div>
          <p>Swipe through clear transformation-style media before choosing your Shea Wellness routine.</p>
        </div>
        <div className="commerce-before-after-rail" aria-label="Before and after carousel">
          {beforeAfterSlides.map((slide) => (
            <article key={slide.title}>
              <img src={slide.image} alt={slide.title} loading="lazy" />
              <div>
                {slide.labels.map((label) => <strong key={label}>{label}</strong>)}
              </div>
            </article>
          ))}
        </div>
      </section>

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
            ["100%", "Natural, organic product positioning with paraben-free and sulfate-free formulas."],
            ["KAM", "Expo participation at the Changamka Festival with wellness retail visibility."],
            ["Nairobi", "Unga House, 1st Floor, Westlands support for retail and distributor enquiries."]
          ].map(([value, detail]) => (
            <article key={value}>
              <strong>{value}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="commerce-newsletter">
        <figure className="commerce-newsletter-media">
          <img src="/assets/sheawellness/grapefruit-shea-butter-front.jpeg" alt="Shea Wellness grapefruit body and face butter" />
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

      <footer className="commerce-footer">
        <div className="commerce-footer-brand">
          <strong>{store.name}</strong>
          <p>Premium handcrafted shea butter skincare and wellness products made from ethically sourced Nilotica shea.</p>
          <small>Unga House, 1st Floor, Westlands, Nairobi</small>
        </div>
        <div>
          <span>Shop</span>
          <a href="/shop">Shop products</a>
          <a href="/products">Product guide</a>
          <a href="/catalogue">Media catalogue</a>
        </div>
        <div>
          <span>Company</span>
          <a href="/about">About</a>
          <a href="/sustainability">Sustainability</a>
          <a href="/quality">Quality</a>
        </div>
        <div>
          <span>Contact</span>
          <a href="mailto:sheabutterwellness@gmail.com">Email</a>
          <a href="tel:+254729621930">+254729621930</a>
        </div>
      </footer>

      <nav className="commerce-mobile-tabs" aria-label="Mobile storefront navigation">
        <a href="#top"><Home size={20} /><span>Home</span></a>
        <a href="/shop"><Grid2X2 size={20} /><span>Shop</span></a>
        <button type="button" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={20} />
          <span>Cart</span>
          <b>{cartCount}</b>
        </button>
        <button type="button" onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0}>
          <CreditCard size={20} />
          <span>Checkout</span>
        </button>
      </nav>

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
          onClose={() => setCheckoutOpen(false)}
          onPlaceOrder={placeOrder}
        />
      ) : null}
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
    <aside className={clsx("commerce-drawer", open && "open")} aria-hidden={!open}>
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
          <article key={`${line.product.id}-${line.size}`}>
            <img src={line.product.imageUrl} alt={line.product.title} style={{ objectPosition: line.product.imagePosition }} />
            <div>
              <strong>{line.product.title}</strong>
              <span>{line.size}</span>
              <b>{formatMoney(line.product.price, currency)}</b>
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
        <div className="commerce-modal-media">
          <img src={product.imageUrl} alt={product.title} style={{ objectPosition: product.imagePosition }} />
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
            <strong>{formatMoney(product.price, currency)}</strong>
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
  onClose: () => void;
  onPlaceOrder: () => Promise<void>;
}) {
  const steps: CheckoutStep[] = ["information", "delivery", "payment", "review"];
  const canProceed = step !== "information" || Boolean(form.email && form.fullName && form.address && form.city);

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
              <span>Order confirmed</span>
              <h2>{orderNumber}</h2>
              <p>Your Shea Wellness order has been prepared for confirmation, fulfilment, and customer notification.</p>
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
                <CheckoutDelivery form={form} setForm={setForm} currency={currency} />
              ) : null}
              {step === "payment" ? (
                <CheckoutPayment form={form} setForm={setForm} />
              ) : null}
              {step === "review" ? (
                <CheckoutReview form={form} cart={cart} currency={currency} total={total} />
              ) : null}
              <div className="commerce-checkout-actions">
                <button type="button" className="secondary" onClick={() => {
                  const index = steps.indexOf(step);
                  setStep(index <= 0 ? "information" : steps[index - 1]);
                }}>Back</button>
                {step === "review" ? (
                  <button type="button" onClick={onPlaceOrder}>Place order</button>
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
              <strong>{formatMoney(line.product.price * line.quantity, currency)}</strong>
            </div>
          ))}
          <div><span>Subtotal</span><strong>{formatMoney(subtotal, currency)}</strong></div>
          <div><span>Shipping</span><strong>{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</strong></div>
          <div><span>Estimated VAT</span><strong>{formatMoney(tax, currency)}</strong></div>
          <div className="total"><span>Total</span><strong>{formatMoney(total, currency)}</strong></div>
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
      <label>Address<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Street address" /></label>
      <div className="commerce-form-row">
        <label>City<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
        <label>Postal code<input value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} /></label>
      </div>
    </div>
  );
}

function CheckoutDelivery({ form, setForm, currency }: { form: CheckoutForm; setForm: (form: CheckoutForm) => void; currency: string }) {
  return (
    <div className="commerce-checkout-panel">
      <span>Delivery</span>
      <h2>Choose a delivery promise</h2>
      {[
        { id: "standard", title: "Standard tracked", detail: "Retail and wellness orders", price: 450 },
        { id: "express", title: "Express courier", detail: "Priority retail or spa replenishment", price: 900 }
      ].map((method) => (
        <button
          type="button"
          className={clsx("commerce-option", form.deliveryMethod === method.id && "active")}
          key={method.id}
          onClick={() => setForm({ ...form, deliveryMethod: method.id as CheckoutForm["deliveryMethod"] })}
        >
          <span><strong>{method.title}</strong><small>{method.detail}</small></span>
          <b>{formatMoney(method.price, currency)}</b>
        </button>
      ))}
    </div>
  );
}

function CheckoutPayment({ form, setForm }: { form: CheckoutForm; setForm: (form: CheckoutForm) => void }) {
  return (
    <div className="commerce-checkout-panel">
      <span>Payment</span>
      <h2>Payment method</h2>
      {[
        { id: "card", title: "Credit or debit card", detail: "Secure retail checkout", icon: CreditCard },
        { id: "paypal", title: "PayPal", detail: "External wallet checkout", icon: ShieldCheck }
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
      <h2>Confirm before payment</h2>
      <div className="commerce-review-box">
        <strong>{form.fullName}</strong>
        <p>{form.email}</p>
        <p>{form.address}, {form.city} {form.postalCode}</p>
        <p>{form.deliveryMethod === "express" ? "Express courier" : "Standard tracked"} / {form.paymentMethod === "card" ? "Card" : "PayPal"}</p>
      </div>
      <div className="commerce-review-box">
        <strong>{cart.length} line items</strong>
        <p>Total authorization: {formatMoney(total, currency)}</p>
      </div>
    </div>
  );
}
