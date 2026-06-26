"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Eye,
  Grid2X2,
  Heart,
  Home,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Truck,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { formatMoney } from "@/lib/format";
import type { Product, Store } from "@/lib/types";

type CartLine = {
  product: Product;
  quantity: number;
  color: string;
  size: string;
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

export function CommerceStorefront({ store, products }: { store: Store; products: Product[] }) {
  const liveProducts = products.filter((product) => product.status === "active" || product.status === "low_stock");
  const categories = ["All", ...Array.from(new Set(liveProducts.map((product) => product.category)))];
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("information");
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>(defaultForm);
  const [orderNumber, setOrderNumber] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  const heroProducts = liveProducts.slice(0, 5);
  const heroProduct = heroProducts[heroIndex] ?? liveProducts[0];
  const navItems = ["Body Care", "Face Care", "Hair Care", "Wholesale"];

  function moveHero(direction: 1 | -1) {
    if (heroProducts.length < 2) return;
    setHeroIndex((index) => (index + direction + heroProducts.length) % heroProducts.length);
  }

  useEffect(() => {
    if (heroProducts.length < 2) return;
    const timer = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % heroProducts.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [heroProducts.length]);

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
  const shipping = subtotal > 150 || subtotal === 0 ? 0 : checkoutForm.deliveryMethod === "express" ? 18 : 8;
  const tax = subtotal * 0.0825;
  const total = subtotal + shipping + tax;
  const cartCount = cart.reduce((totalQuantity, line) => totalQuantity + line.quantity, 0);

  function addToCart(product: Product, quantity = 1, color = product.colors[0], size = product.sizes[0]) {
    setCart((lines) => {
      const existingIndex = lines.findIndex((line) => line.product.id === product.id && line.color === color && line.size === size);
      if (existingIndex === -1) {
        return [...lines, { product, quantity, color, size }];
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
          color: line.color,
          size: line.size,
          unitPrice: line.product.price
        })),
        totals: { subtotal, shipping, tax, total }
      })
    });

    const payload = (await response.json()) as { data?: { orderNumber: string } };
    setOrderNumber(payload.data?.orderNumber ?? `SHEA-${Date.now().toString().slice(-6)}`);
    setCheckoutStep("success");
    setCart([]);
  }

  return (
    <main className="commerce-site">
      <header className="commerce-header">
        <div className="commerce-promo">100% natural ingredients. Ethically sourced African shea. Export-ready quality.</div>
        <div className="commerce-nav">
          <a className="commerce-logo" href="#top" aria-label={`${store.name} home`}>
            {store.name}
          </a>
          <nav aria-label="Store navigation">
            {navItems.map((item) => (
              <a href={item === "Wholesale" ? "#wholesale" : "#products"} key={item}>
                {item}
              </a>
            ))}
          </nav>
          <div className="commerce-nav-actions-main">
            <button type="button" aria-label="Search products">
              <Search size={18} />
            </button>
            <button type="button" aria-label="View account">
              <UserRound size={18} />
            </button>
            <button type="button" aria-label="Wishlist">
              <Heart size={18} />
            </button>
          </div>
          <button type="button" className="commerce-cart-button" onClick={() => setCartOpen(true)}>
            <ShoppingCart size={18} />
            Cart
            <span>{cartCount}</span>
          </button>
        </div>
      </header>

      <section className="commerce-hero" id="top">
        <div className="commerce-hero-card" aria-label="Featured product carousel">
          {heroProduct ? (
            <img src={heroProduct.imageUrl} alt={heroProduct.title} style={{ objectPosition: heroProduct.imagePosition }} />
          ) : (
            <img src="/assets/storefront-hero.png" alt="Curated retail products in a premium ecommerce campaign" />
          )}
          <div className="commerce-hero-overlay" />

          <div className="commerce-hero-copy">
            <span>{heroProduct?.category ?? "Pure Nailotica Shea"}</span>
            <h1>{heroProduct?.title ?? "Modern wellness essentials"}</h1>
            <div className="commerce-hero-actions">
              {heroProduct ? (
                <button type="button" onClick={() => addToCart(heroProduct)}>
                  Shop Product
                </button>
              ) : null}
              <button type="button" className="ghost" onClick={() => {
                if (heroProduct) setSelectedProduct(heroProduct);
              }}>
                View Details
              </button>
            </div>
          </div>

          <div className="commerce-hero-meta">
            <strong>{formatMoney(heroProduct?.price ?? 0, store.currency)}</strong>
            <span><Star size={14} fill="currentColor" /> {heroProduct?.rating ?? 4.9}</span>
          </div>

          <button type="button" className="commerce-carousel-arrow previous" onClick={() => moveHero(-1)} aria-label="Previous product">
            <ArrowLeft size={20} />
          </button>
          <button type="button" className="commerce-carousel-arrow next" onClick={() => moveHero(1)} aria-label="Next product">
            <ArrowRight size={20} />
          </button>

          <div className="commerce-carousel-dots" aria-label="Choose featured product">
            {heroProducts.map((product, index) => (
              <button
                type="button"
                key={product.id}
                className={clsx(heroIndex === index && "active")}
                onClick={() => setHeroIndex(index)}
                aria-label={`Show ${product.title}`}
              />
            ))}
          </div>
        </div>
        <div className="commerce-carousel-rail" aria-label="Featured product thumbnails">
          {heroProducts.map((product, index) => (
            <button
              type="button"
              key={product.id}
              className={clsx(heroIndex === index && "active")}
              onClick={() => setHeroIndex(index)}
            >
              <img src={product.imageUrl} alt="" style={{ objectPosition: product.imagePosition }} />
              <span>{product.category}</span>
              <strong>{product.title}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="commerce-service-strip" aria-label="Store benefits">
        <span><Truck size={18} /> Export-ready packaging</span>
        <span><RotateCcw size={18} /> Wholesale support</span>
        <span><ShieldCheck size={18} /> Paraben and sulfate free</span>
        <span><Star size={18} /> Handmade wellness products</span>
      </section>

      <section className="commerce-categories" id="collections">
        <div className="commerce-section-title">
          <span>Collections</span>
          <h2>Shop Shea Wellness rituals.</h2>
        </div>
        <div className="commerce-category-grid">
          {categories.slice(1).map((category) => (
            <button type="button" key={category} onClick={() => setActiveCategory(category)}>
              <img
                src={liveProducts.find((product) => product.category === category)?.imageUrl ?? "/assets/shea-hero.png"}
                alt=""
                style={{ objectPosition: liveProducts.find((product) => product.category === category)?.imagePosition ?? "50% 50%" }}
              />
              <i />
              <span>{category}</span>
              <strong>{liveProducts.filter((product) => product.category === category).length} products</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="commerce-feature-band">
        <article>
          <span>Pure Nailotica Shea</span>
          <h2>Modern skincare rooted in African wellness heritage.</h2>
          <p>Clean, ethical, and sustainable formulations for daily body care, face care, hair growth rituals, aromatherapy, and professional spa supply.</p>
          <a href="#products">Shop products <ArrowRight size={17} /></a>
        </article>
        <div className="commerce-feature-mosaic">
          {liveProducts.slice(0, 4).map((product) => (
            <button type="button" key={product.id} onClick={() => setSelectedProduct(product)}>
              <img src={product.imageUrl} alt={product.title} style={{ objectPosition: product.imagePosition }} />
              <span>{product.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="commerce-products-section" id="products">
        <div className="commerce-section-title split">
          <div>
            <span>Shop</span>
            <h2>Shop natural skincare and wellness.</h2>
            <p className="commerce-shop-intro">
              Premium handcrafted shea butter products with quick view, variants, reviews, delivery confidence, and clear cart actions.
            </p>
          </div>
          <div className="commerce-controls">
            <label>
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search catalog" />
            </label>
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
          </div>
        </div>

        <div className="commerce-filter-row">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={clsx(activeCategory === category && "active")}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="commerce-product-grid">
          {filteredProducts.map((product) => (
            <article className="commerce-product-card" key={product.id}>
              <button type="button" className="commerce-product-image" onClick={() => setSelectedProduct(product)}>
                <img src={product.imageUrl} alt={product.title} style={{ objectPosition: product.imagePosition }} />
                <span>{product.badge}</span>
                <b>Quick view</b>
              </button>
              <div className="commerce-product-body">
                <div>
                  <div className="commerce-card-kicker">
                    <small>{product.category}</small>
                    <em>{product.deliveryBadge}</em>
                  </div>
                  <strong>{product.title}</strong>
                  <p>{product.description}</p>
                </div>
                <div className="commerce-rating">
                  <span><Star size={14} fill="currentColor" /> {product.rating}</span>
                  <small>{product.reviewCount} reviews</small>
                </div>
                <div className="commerce-swatch-row" aria-label={`${product.title} colors`}>
                  {product.colors.slice(0, 4).map((color) => (
                    <span key={color} title={color} />
                  ))}
                  <small>{product.colors.length} colors</small>
                </div>
                <div className="commerce-price-row">
                  <span>{formatMoney(product.price, store.currency)}</span>
                  {product.compareAtPrice ? <del>{formatMoney(product.compareAtPrice, store.currency)}</del> : null}
                </div>
                <div className="commerce-card-actions">
                  <button type="button" onClick={() => addToCart(product)}>
                    <ShoppingCart size={17} />
                    Add
                  </button>
                  <button type="button" className="secondary" onClick={() => setSelectedProduct(product)}>
                    <Eye size={17} />
                    View
                  </button>
                </div>
              </div>
            </article>
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
          African shea products with reliable fulfilment and premium product presentation.
        </p>
      </section>

      <section className="commerce-social-proof">
        <div className="commerce-section-title">
          <span>Why Shea Wellness</span>
          <h2>Clean formulations, ethical sourcing, and African heritage in every ritual.</h2>
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
        <div>
          <span>Wellness education</span>
          <h2>Get skincare rituals, distributor updates, and product launches.</h2>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <input type="email" placeholder="Email address" aria-label="Email address" />
          <button type="button">Join</button>
        </form>
      </section>

      <footer className="commerce-footer">
        <div>
          <strong>{store.name}</strong>
          <p>Premium handcrafted shea butter skincare and wellness products made from ethically sourced African shea.</p>
        </div>
        <div>
          <span>Shop</span>
          <a href="#products">Products</a>
          <a href="#collections">Collections</a>
        </div>
        <div>
          <span>Support</span>
          <a href="mailto:sheabutterwellness@gmail.com">Email</a>
          <a href="tel:+254729621930">+254729621930</a>
        </div>
        <small>Unga House, 1st Floor, Westlands, Nairobi</small>
      </footer>

      <nav className="commerce-mobile-tabs" aria-label="Mobile storefront navigation">
        <a href="#top"><Home size={20} /><span>Home</span></a>
        <a href="#collections"><Grid2X2 size={20} /><span>Shop</span></a>
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

      {selectedProduct ? (
        <ProductModal
          product={selectedProduct}
          currency={store.currency}
          onClose={() => setSelectedProduct(null)}
          onAdd={(product, color, size) => {
            addToCart(product, 1, color, size);
            setSelectedProduct(null);
          }}
        />
      ) : null}

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
          <article key={`${line.product.id}-${line.color}-${line.size}`}>
            <img src={line.product.imageUrl} alt={line.product.title} style={{ objectPosition: line.product.imagePosition }} />
            <div>
              <strong>{line.product.title}</strong>
              <span>{line.color} / {line.size}</span>
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
  onClose,
  onAdd
}: {
  product: Product;
  currency: string;
  onClose: () => void;
  onAdd: (product: Product, color: string, size: string) => void;
}) {
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);

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
          <span>{product.badge}</span>
          <h2>{product.title}</h2>
          <div className="commerce-rating">
            <span><Star size={14} fill="currentColor" /> {product.rating}</span>
            <small>{product.reviewCount} verified reviews</small>
          </div>
          <p>{product.description}</p>
          <dl>
            <div><dt>Material</dt><dd>{product.material}</dd></div>
            <div><dt>Delivery</dt><dd>{product.deliveryBadge}</dd></div>
            <div><dt>Care</dt><dd>Store in a cool, dry place away from direct sunlight</dd></div>
          </dl>
          <fieldset>
            <legend>Color</legend>
            {product.colors.map((item) => (
              <button type="button" className={clsx(color === item && "active")} key={item} onClick={() => setColor(item)}>{item}</button>
            ))}
          </fieldset>
          <fieldset>
            <legend>Size</legend>
            {product.sizes.map((item) => (
              <button type="button" className={clsx(size === item && "active")} key={item} onClick={() => setSize(item)}>{item}</button>
            ))}
          </fieldset>
          <div className="commerce-modal-buy">
            <strong>{formatMoney(product.price, currency)}</strong>
            <button type="button" onClick={() => onAdd(product, color, size)}>
              <ShoppingCart size={18} />
              Add to cart
            </button>
          </div>
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
            <div className="commerce-summary-line" key={`${line.product.id}-${line.color}-${line.size}`}>
              <span>{line.quantity}x {line.product.title}</span>
              <strong>{formatMoney(line.product.price * line.quantity, currency)}</strong>
            </div>
          ))}
          <div><span>Subtotal</span><strong>{formatMoney(subtotal, currency)}</strong></div>
          <div><span>Shipping</span><strong>{shipping === 0 ? "Free" : formatMoney(shipping, currency)}</strong></div>
          <div><span>Estimated tax</span><strong>{formatMoney(tax, currency)}</strong></div>
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
        { id: "standard", title: "Standard tracked", detail: "Retail and wellness orders", price: 8 },
        { id: "express", title: "Express courier", detail: "Priority retail or spa replenishment", price: 18 }
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
