"use client";

import { ArrowRight, Gift, Heart, Home, Menu, Search, ShoppingBag, ShoppingCart, Sparkles, Store, UserRound, X } from "lucide-react";
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

const pageSearchLinks = [
  { label: "Wellness guides", href: "/wellness-guides", body: "Dry skin, sensitive skin, face, body glow, hair, scalp, and spa routines." },
  { label: "Wholesale", href: "/wholesale", body: "Distributor pricing, partners, and bulk supply." },
  { label: "Sustainability", href: "/sustainability", body: "Ethical sourcing and eco-conscious packaging." },
  { label: "Quality", href: "/quality", body: "Ingredients, standards, and formulation promises." },
  { label: "Blog", href: "/blog", body: "Wellness education and skincare routines." },
  { label: "Contact", href: "/contact", body: "Reach Shea Wellness LTD." }
];

const categoryLinks = [
  { label: "Face", href: "/collections/face-care" },
  { label: "Skin", href: "/collections/body-care" },
  { label: "Hair", href: "/collections/hair-care" },
  { label: "Wellness Gifts", href: "/shop?search=gift" },
  { label: "SPA Essentials", href: "/wellness-guides#spa-essentials" }
];

const sidebarLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shop all", href: "/shop", icon: ShoppingBag },
  { label: "Products", href: "/products", icon: Store },
  { label: "Wellness guides", href: "/wellness-guides", icon: Sparkles },
  { label: "Wellness gifts", href: "/shop?search=gift", icon: Gift },
  { label: "Wholesale", href: "/wholesale", icon: Store },
  { label: "About us", href: "/about", icon: UserRound },
  { label: "Sustainability", href: "/sustainability", icon: Sparkles },
  { label: "Quality", href: "/quality", icon: Heart },
  { label: "Blog", href: "/blog", icon: ShoppingBag },
  { label: "Catalogue", href: "/catalogue", icon: ShoppingBag },
  { label: "Contact", href: "/contact", icon: UserRound }
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
    <>
    <button
      type="button"
      className={`shea-sidebar-scrim${mobileOpen ? " open" : ""}`}
      onClick={() => setMobileOpen(false)}
      aria-label="Close site navigation"
      tabIndex={mobileOpen ? 0 : -1}
    />
    <aside className={`shea-desktop-sidebar${mobileOpen ? " open" : ""}`} aria-label="Complete site navigation" aria-hidden={!mobileOpen}>
      <div className="shea-sidebar-topline">
        <span>Menu</span>
        <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close site navigation"><X size={22} /></button>
      </div>
      <a className="shea-sidebar-logo" href="/" aria-label={`${sheaBrand.name} home`}>
        <img src="/assets/shea-wellness-tree-logo.jpeg" alt="Shea Wellness" />
      </a>
      <div className="shea-sidebar-label">Explore Shea Wellness</div>
      <nav>
        {sidebarLinks.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("?")[0].split("#")[0]);
          return <a href={item.href} className={active ? "active" : undefined} key={item.label}><Icon size={18} /><span>{item.label}</span></a>;
        })}
      </nav>
      <div className="shea-sidebar-contact">
        <span>Need help choosing?</span>
        <a href={`tel:${sheaBrand.phone}`}>{sheaBrand.phone}</a>
        <a href={`mailto:${sheaBrand.email}`}>Email Shea Wellness</a>
      </div>
    </aside>

    <header className="shea-nav-shell">
      <div className="shea-nav-promo">
        <span className="promo-full">100% natural ingredients. Ethically sourced Nilotica shea. Export-ready quality.</span>
        <span className="promo-short">100% natural. Nilotica shea. Export-ready.</span>
      </div>
      <div className="shea-nav-bar">
        <a className="shea-nav-brand" href="/" aria-label={`${sheaBrand.name} home`}>
          <img src="/assets/shea-wellness-tree-logo.jpeg" alt={sheaBrand.name} />
        </a>

        <nav className="shea-nav-desktop" aria-label="Primary navigation">
          {categoryLinks.map((item) => (
            <a href={item.href} className={pathname.startsWith(item.href.split("?")[0].split("#")[0]) ? "active" : undefined} key={item.label}>{item.label}</a>
          ))}
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

      <nav className="shea-mobile-category-nav" aria-label="Product categories">
        {categoryLinks.map((item) => <a href={item.href} key={item.label}>{item.label}</a>)}
      </nav>

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

    </header>
    </>
  );
}
