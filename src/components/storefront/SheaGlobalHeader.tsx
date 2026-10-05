"use client";

import { ArrowRight, Gift, Heart, Home, Menu, Search, ShoppingBag, ShoppingCart, Sparkles, Store, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { sheaBrand } from "@/lib/shea-content";
import type { Product } from "@/lib/types";
import { useStorefrontCart } from "./StorefrontCart";
import styles from "./SheaGlobalHeader.module.css";

type SheaGlobalHeaderProps = {
  products?: Product[];
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
  { label: "Face", href: "/face", icon: Sparkles },
  { label: "Skin", href: "/skin", icon: Heart },
  { label: "Hair", href: "/hair", icon: Sparkles },
  { label: "Wellness Gifts", href: "/wellness-gifts", icon: Gift },
  { label: "SPA Essentials", href: "/spa-essentials", icon: Store }
];

const primaryLinks = [
  ...categoryLinks,
  { label: "Our Story", href: "/about", icon: UserRound }
];

const sidebarLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shop all", href: "/shop", icon: ShoppingBag },
  { label: "Products", href: "/products", icon: Store },
  { label: "Wellness guides", href: "/wellness-guides", icon: Sparkles },
  { label: "Wellness gifts", href: "/shop?search=gift", icon: Gift },
  { label: "Wholesale", href: "/wholesale", icon: Store },
  { label: "Our story", href: "/about", icon: UserRound },
  { label: "Sustainability", href: "/sustainability", icon: Sparkles },
  { label: "Quality", href: "/quality", icon: Heart },
  { label: "Blog", href: "/blog", icon: ShoppingBag },
  { label: "Catalogue", href: "/catalogue", icon: ShoppingBag },
  { label: "Contact", href: "/contact", icon: UserRound }
];

export function SheaGlobalHeader({ products = [], searchValue, onSearchChange }: SheaGlobalHeaderProps) {
  const { count, open, ready } = useStorefrontCart();
  const pathname = usePathname();
  const [localSearch, setLocalSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const value = searchValue ?? localSearch;
  const searchTerm = value.trim().toLowerCase();
  const searchResults = [
    ...products.filter(product => ["active", "low_stock"].includes(product.status)).map((product) => ({
      label: product.title,
      href: `/shop?search=${encodeURIComponent(product.title)}`,
      body: `${product.category} - ${product.description}`
    })),
    ...pageSearchLinks
  ].filter((item) => {
    if (!searchTerm) return true;
    return `${item.label} ${item.body}`.toLowerCase().includes(searchTerm);
  }).slice(0, 7);

  useEffect(() => {
    document.body.classList.toggle("shea-menu-open", mobileOpen);
    if (mobileOpen && sidebarRef.current) sidebarRef.current.scrollTop = 0;
    return () => document.body.classList.remove("shea-menu-open");
  }, [mobileOpen]);

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



  return (
    <>
    <button
      type="button"
      className={`shea-sidebar-scrim${mobileOpen ? " open" : ""}`}
      onClick={() => setMobileOpen(false)}
      aria-label="Close site navigation"
      tabIndex={mobileOpen ? 0 : -1}
    />
    <aside ref={sidebarRef} className={`shea-desktop-sidebar${mobileOpen ? " open" : ""}`} aria-label="Complete site navigation" aria-hidden={!mobileOpen}>
      <div className="shea-sidebar-topline">
        <a href="/" aria-label={`${sheaBrand.name} home`}>
          <img src="/assets/website-edits/shea-wellness-logo.jpg" alt="Shea Wellness" />
          <span><strong>Shea Wellness</strong><small>Care inspired by nature</small></span>
        </a>
        <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close site navigation"><X size={22} /></button>
      </div>

      <section className="shea-sidebar-feature">
        <span>Natural care, clearly guided</span>
        <strong>Find the right routine for skin, face, hair, and home.</strong>
        <a href="/wellness-guides">Explore wellness guides <ArrowRight size={16} /></a>
      </section>

      <div className="shea-sidebar-label">Shop by category</div>
      <nav className="shea-sidebar-category-grid" aria-label="Shop by category">
        {categoryLinks.map((item) => {
          const Icon = item.icon;
          return <a href={item.href} key={item.label}><i><Icon size={17} /></i><span>{item.label}</span><ArrowRight size={15} /></a>;
        })}
      </nav>

      <div className="shea-sidebar-label">Explore</div>
      <nav className="shea-sidebar-site-grid" aria-label="Explore Shea Wellness">
        {sidebarLinks.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("?")[0].split("#")[0]);
          return <a href={item.href} className={active ? "active" : undefined} key={item.label}><Icon size={18} /><span>{item.label}</span></a>;
        })}
      </nav>
      <div className="shea-sidebar-contact">
        <div><span>Need help choosing?</span><small>Talk to the Shea Wellness team.</small></div>
        <a href={`tel:${sheaBrand.phone}`}>Call us</a>
        <a href="/account">My account</a>
      </div>
    </aside>

    <header className={styles.shell} data-testid="global-header" data-cart-ready={ready}>
      <div className={styles.promo}>100% natural. Ethically sourced Nilotica shea.</div>
      <div className={styles.bar}>
        <a className={styles.brand} href="/" aria-label={sheaBrand.name + " home"}>
          <img src="/assets/website-edits/shea-wellness-logo.jpg" alt={sheaBrand.name} width={54} height={54} />
          <span><strong>Shea Wellness</strong><small>Care inspired by nature</small></span>
        </a>
        <nav className={styles.desktop} aria-label="Primary navigation">
          {primaryLinks.map(item => <a href={item.href} key={item.label} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</a>)}
        </nav>
        <div className={styles.actions}>
          <button type="button" className={styles.icon} onClick={() => setSearchOpen(value => !value)} aria-label="Search Shea Wellness" aria-expanded={searchOpen}><Search size={19} /></button>
          <a className={styles.icon + " " + styles.desktopAction} href="/account" aria-label="Open customer account"><UserRound size={19} /></a>
          <a className={styles.icon + " " + styles.desktopAction} href="/shop" aria-label="Wishlist"><Heart size={19} /></a>
          <button type="button" className={styles.cart} onClick={open} aria-label={"Open cart, " + count + " items"} data-testid="header-cart"><ShoppingCart size={19} /><b>{count}</b></button>
          <button type="button" className={styles.icon} onClick={() => setMobileOpen(value => !value)} aria-expanded={mobileOpen} aria-label={mobileOpen ? "Close navigation" : "Open navigation"}>{mobileOpen ? <X size={19} /> : <Menu size={21} />}</button>
        </div>
      </div>
      <nav className={styles.categories} aria-label="Product categories">
        {primaryLinks.map(item => <a href={item.href} key={item.label} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</a>)}
      </nav>
      {searchOpen && <section className={styles.search} aria-label="Search Shea Wellness">
        <form onSubmit={submitSearch}><Search size={18} /><input autoFocus value={value} onChange={event => setValue(event.target.value)} placeholder="Search products and pages" aria-label="Search products, pages, wholesale, quality" /><button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={18} /></button></form>
        <div>{searchResults.map(item => <a href={item.href} key={item.href + item.label}><span><strong>{item.label}</strong><small>{item.body}</small></span><ArrowRight size={16} /></a>)}</div>
      </section>}
    </header>
    </>
  );
}
