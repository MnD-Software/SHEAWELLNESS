"use client";

import { ArrowRight, ChevronDown, Heart, LogIn, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";
import { sheaBrand } from "@/lib/shea-content";
import { platformSnapshot } from "@/lib/platform-data";

type SheaGlobalHeaderProps = {
  cartCount?: number;
  onCartOpen?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

const shopLinks = [
  { label: "Shop all", href: "/shop", body: "All Shea Wellness products in one catalogue." },
  { label: "Body care", href: "/collections/body-care", body: "Body butters, raw shea, and daily moisture rituals." },
  { label: "Face care", href: "/collections/face-care", body: "Black soap cleansers and gentle botanical routines." },
  { label: "Hair care", href: "/collections/hair-care", body: "Scalp, edge, and hair moisture essentials." },
  { label: "Media catalogue", href: "/catalogue", body: "Product films, images, and brand proof." }
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Quality", href: "/quality" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" }
];

const pageSearchLinks = [
  { label: "Wholesale", href: "/wholesale", body: "Distributor pricing, partners, and bulk supply." },
  { label: "Sustainability", href: "/sustainability", body: "Ethical sourcing and eco-conscious packaging." },
  { label: "Quality", href: "/quality", body: "Ingredients, standards, and formulation promises." },
  { label: "Blog", href: "/blog", body: "Wellness education and skincare routines." },
  { label: "Contact", href: "/contact", body: "Reach Shea Wellness LTD." }
];

const mobilePrimaryLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Body Care", href: "/collections/body-care" },
  { label: "Face Care", href: "/collections/face-care" },
  { label: "Hair Care", href: "/collections/hair-care" },
  { label: "Reviews", href: "/shop#products" },
  { label: "How to Use", href: "/blog" },
  { label: "Wholesale", href: "/wholesale" }
];

const mobilePolicyLinks = [
  { label: "About", href: "/about" },
  { label: "Quality", href: "/quality" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Contact", href: "/contact" }
];

export function SheaGlobalHeader({ cartCount, onCartOpen, searchValue, onSearchChange }: SheaGlobalHeaderProps) {
  const pathname = usePathname();
  const [localSearch, setLocalSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const value = searchValue ?? localSearch;
  const searchTerm = value.trim().toLowerCase();
  const searchResults = [
    ...platformSnapshot.products.map((product) => ({
      label: product.title,
      href: `/shop?search=${encodeURIComponent(product.title)}`,
      body: `${product.category} - ${product.description}`
    })),
    ...pageSearchLinks
  ].filter((item) => {
    if (!searchTerm) return true;
    return `${item.label} ${item.body}`.toLowerCase().includes(searchTerm);
  }).slice(0, 7);

  function setValue(nextValue: string) {
    if (onSearchChange) {
      onSearchChange(nextValue);
      return;
    }
    setLocalSearch(nextValue);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onSearchChange) return;
    const term = value.trim();
    window.location.href = term ? `/shop?search=${encodeURIComponent(term)}` : "/shop";
  }

  const shopActive = pathname === "/shop" || pathname.startsWith("/products/") || pathname.startsWith("/collections/");
  const companyActive = ["/about", "/sustainability", "/quality", "/contact"].some((path) => pathname.startsWith(path));

  const cartAction = onCartOpen ? (
    <button type="button" className="shea-nav-cart" onClick={onCartOpen}>
      <ShoppingCart size={18} />
      <span>Cart</span>
      <b>{cartCount ?? 0}</b>
    </button>
  ) : (
    <a className="shea-nav-cart" href="/shop">
      <ShoppingCart size={18} />
      <span>Cart</span>
      <b>{cartCount ?? 0}</b>
    </a>
  );

  return (
    <header className="shea-nav-shell">
      <div className="shea-nav-promo">100% natural ingredients. Ethically sourced Nilotica shea. Export-ready quality.</div>
      <div className="shea-nav-bar">
        <a className="shea-nav-brand" href="/" aria-label={`${sheaBrand.name} home`}>
          <img src="/assets/shea-wellness-header-logo.jpeg" alt={sheaBrand.name} />
        </a>

        <nav className="shea-nav-desktop" aria-label="Primary navigation">
          <a href="/" className={pathname === "/" ? "active" : undefined}>Home</a>
          <div className="shea-nav-dropdown">
            <a href="/shop" className={`shea-nav-trigger${shopActive ? " active" : ""}`}>
              Shop <ChevronDown size={15} />
            </a>
            <div className="shea-nav-mega">
              <div className="shea-nav-mega-copy">
                <span>Shop by ritual</span>
                <strong>Clean product paths without crowding the header.</strong>
                <p>Browse the store by category, use case, or product media.</p>
              </div>
              <div className="shea-nav-mega-links">
                {shopLinks.map((item) => (
                  <a href={item.href} key={item.label}>
                    <strong>{item.label}</strong>
                    <span>{item.body}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <a href="/wholesale" className={pathname.startsWith("/wholesale") ? "active" : undefined}>Wholesale</a>
          <a href="/blog" className={pathname.startsWith("/blog") ? "active" : undefined}>Blog</a>
          <div className="shea-nav-dropdown small">
            <button type="button" className={`shea-nav-trigger${companyActive ? " active" : ""}`}>
              Company <ChevronDown size={15} />
            </button>
            <div className="shea-nav-menu-card">
              {companyLinks.map((item) => (
                <a href={item.href} key={item.label}>{item.label}</a>
              ))}
            </div>
          </div>
        </nav>

        <div className="shea-nav-actions">
          <button type="button" className="shea-nav-search-button" onClick={() => setSearchOpen((open) => !open)} aria-label="Search Shea Wellness">
            <Search size={18} />
          </button>
          <a href="/account" aria-label="Open customer account"><UserRound size={18} /></a>
          <a href="/shop" aria-label="Wishlist"><Heart size={18} /></a>
          {cartAction}
        </div>

        <button type="button" className="shea-nav-search-button mobile-action" onClick={() => setSearchOpen((open) => !open)} aria-label="Search Shea Wellness">
          <Search size={19} />
        </button>
        <button
          type="button"
          className="shea-nav-mobile-toggle"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label="Open navigation"
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {searchOpen ? (
        <section className="shea-nav-search-panel" aria-label="Search Shea Wellness">
          <form className="shea-nav-search expanded" onSubmit={submitSearch}>
            <Search size={18} />
            <input
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Search products, pages, wholesale, quality..."
              aria-label="Search products, pages, wholesale, quality"
            />
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18} /></button>
          </form>
          <div className="shea-nav-search-results">
            {searchResults.map((item) => (
              <a href={item.href} key={`${item.href}-${item.label}`}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.body}</small>
                </span>
                <ArrowRight size={16} />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {mobileOpen ? (
        <div className="shea-mobile-menu-layer" role="dialog" aria-modal="true" aria-label="Mobile navigation menu">
          <button type="button" className="shea-mobile-menu-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <aside className="shea-nav-mobile-panel">
            <div className="shea-mobile-menu-head">
              <strong>Menu</strong>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={24} /></button>
            </div>
            <div className="shea-mobile-menu-scroll">
              <div className="shea-nav-mobile-grid">
                {mobilePrimaryLinks.map((item) => (
                  <a href={item.href} key={item.label}>{item.label}</a>
                ))}
              </div>
              <a className="shea-mobile-login" href="/account">
                <LogIn size={18} />
                Customer account
              </a>
              <div className="shea-nav-mobile-list">
                {mobilePolicyLinks.map((item) => (
                  <a href={item.href} key={item.label}>{item.label}</a>
                ))}
              </div>
            </div>
            <div className="shea-mobile-menu-foot">
              <span>Shea Wellness LTD</span>
              <a href={`mailto:${sheaBrand.email}`}>{sheaBrand.email}</a>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
