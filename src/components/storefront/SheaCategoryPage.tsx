"use client";

import { ArrowRight, Grid2X2, ShoppingCart, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SheaGlobalHeader } from "@/components/storefront/SheaGlobalHeader";
import { formatMoney } from "@/lib/format";
import { categoryToSlug } from "@/lib/product-routing";
import { platformSnapshot } from "@/lib/platform-data";
import type { Product } from "@/lib/types";

export function SheaCategoryPage({ categorySlug, initialCategory }: { categorySlug: string; initialCategory?: string | null }) {
  const [products, setProducts] = useState<Product[]>(platformSnapshot.products);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const savedProducts = window.localStorage.getItem("sheaWellnessProducts");
    const parsedProducts = savedProducts ? (JSON.parse(savedProducts) as Product[]) : platformSnapshot.products;
    const savedCart = JSON.parse(window.localStorage.getItem("sheaWellnessCart") ?? "[]") as Array<{ quantity: number }>;

    setProducts(Array.isArray(parsedProducts) && parsedProducts.length ? parsedProducts : platformSnapshot.products);
    setCartCount(savedCart.reduce((total, line) => total + line.quantity, 0));
  }, []);

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))), [products]);
  const categoryName = categories.find((category) => categoryToSlug(category) === categorySlug) ?? initialCategory ?? categorySlug.replaceAll("-", " ");
  const categoryProducts = products.filter((product) => categoryToSlug(product.category) === categorySlug && (product.status === "active" || product.status === "low_stock"));
  const heroProduct = categoryProducts[0] ?? products.find((product) => product.status === "active") ?? platformSnapshot.products[0];

  return (
    <main className="shea-category-page">
      <SheaGlobalHeader cartCount={cartCount} />

      <section className="shea-category-hero">
        <div>
          <span>Collection</span>
          <h1>{categoryName}</h1>
          <p>Shop Shea Wellness products by category with clear product cards, real product pages, reviews, and cart actions.</p>
          <a href="/shop">All products <ArrowRight size={18} /></a>
        </div>
        <figure>
          <img src={heroProduct.imageUrl} alt={heroProduct.title} style={{ objectPosition: heroProduct.imagePosition }} />
        </figure>
      </section>

      <nav className="shea-category-tabs" aria-label="Product categories">
        <a href="/shop"><Grid2X2 size={18} /> All</a>
        {categories.map((category) => (
          <a href={`/collections/${categoryToSlug(category)}`} className={categoryToSlug(category) === categorySlug ? "active" : ""} key={category}>
            {category}
          </a>
        ))}
      </nav>

      <section className="shea-category-products">
        <div className="shea-section-title">
          <span>{categoryProducts.length} products</span>
          <h2>{categoryProducts.length ? `${categoryName} products` : "No active products in this category yet."}</h2>
        </div>
        <div className="shea-category-product-grid">
          {categoryProducts.map((product) => (
            <article key={product.id}>
              <a href={`/products/${encodeURIComponent(product.id)}`}>
                <img src={product.imageUrl} alt={product.title} style={{ objectPosition: product.imagePosition }} />
              </a>
              <div>
                <span>{product.category}</span>
                <strong>{product.title}</strong>
                <p>{product.description}</p>
                <div>
                  <small><Star size={14} fill="currentColor" /> {product.rating || "New"}</small>
                  <b>{formatMoney(product.price, platformSnapshot.activeStore.currency)}</b>
                </div>
                <a href={`/products/${encodeURIComponent(product.id)}`}>
                  <ShoppingCart size={17} />
                  View product
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
