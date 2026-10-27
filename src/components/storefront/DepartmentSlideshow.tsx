"use client";
import { CAROUSEL_INTERVAL_MS } from "@/lib/carousel-timing";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Product } from "@/lib/types";
import { clearPresetImage, isSidewaysSheaProductAsset } from "@/lib/shea-media";
import { StorefrontImage } from "./StorefrontImage";

export function DepartmentSlideshow({ products, label, extraPhotos = [] }: {
  products: Product[]; label: string; extraPhotos?: Array<{ src: string; title: string }>;
}) {
  const slides = useMemo(() => {
    const seen = new Set<string>();
    return [...products.flatMap(product => [
      { src: product.imageUrl, title: product.title },
      ...(product.gallery ?? []).map(src => ({ src, title: product.title })),
      ...Object.entries(product.sizeMedia ?? {}).map(([size, media]) => ({ src: media.imageUrl ?? "", title: `${product.title} — ${size}` }))
    ]), ...extraPhotos].map(slide => ({ ...slide, src: clearPresetImage(slide.src) })).filter(slide => {
      if (!slide.src || seen.has(slide.src)) return false;
      seen.add(slide.src);
      return true;
    });
  }, [products, extraPhotos]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPaused(motion.matches);
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);
  useEffect(() => { setIndex(0); }, [label]);
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndex(value => (value + 1) % slides.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);
  const current = index % Math.max(slides.length, 1);
  const slide = slides[current];
  useEffect(() => {
    if (slides.length < 2) return;
    // Warm the upcoming photographs before the one-second transition.
    for (let offset = 1; offset <= Math.min(3, slides.length - 1); offset++) {
      const next = new Image();
      next.src = slides[(current + offset) % slides.length].src;
    }
  }, [current, slides]);
  const move = (delta: number) => { setPaused(true); setIndex(value => (value + delta + slides.length) % slides.length); };
  return <div className="department-product-carousel shea-carousel-shell department-slideshow" role="region" aria-roledescription="carousel" aria-label={`${label} slideshow`} data-live-content
    onKeyDown={event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
    }}>
    {slide ? <>
      <div className="department-carousel-stage" role="group" aria-roledescription="slide" aria-label={`${current + 1} of ${slides.length}`} aria-live={paused ? "polite" : "off"}>
        <div className={`department-slideshow-photo${isSidewaysSheaProductAsset(slide.src) ? " is-rotated" : ""}`}>
          <StorefrontImage key={slide.src} className={isSidewaysSheaProductAsset(slide.src) ? "shea-rotated-product-image" : undefined} src={slide.src} alt={slide.title} loading="eager" />
        </div>
        <div className="department-carousel-product-copy"><span>Shea Wellness</span><h2>{slide.title}</h2></div>
      </div>
      {slides.length > 1 && <div className="department-slideshow-controls" data-cms-exclude>
        <button type="button" onClick={() => move(-1)} aria-label="Previous photo"><ChevronLeft size={18} /></button>
        <span>{current + 1} / {slides.length}</span>
        <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Play slideshow" : "Pause slideshow"}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
        <button type="button" onClick={() => move(1)} aria-label="Next photo"><ChevronRight size={18} /></button>
      </div>}
    </> : <p className="department-carousel-empty">New photographs for this collection are coming soon.</p>}
  </div>;
}
