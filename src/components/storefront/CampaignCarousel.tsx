"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import type { SheaHeroSlide } from "@/lib/shea-content";
import styles from "./CampaignCarousel.module.css";
import { isSidewaysSheaProductAsset } from "@/lib/shea-media";

export function CampaignCarousel({ slides }: { slides: SheaHeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const current = index % Math.max(slides.length, 1);
  const slide = slides[current];
  function move(delta: number) {
    setIndex((value) => (value + delta + slides.length) % Math.max(slides.length, 1));
  }
  useEffect(() => {
    if (slides.length < 2 || paused || interacting || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndex((value) => (value + 1) % slides.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [slides.length, paused, interacting]);
  if (!slide) return null;
  return (
    <section className={styles.section} aria-label="Shea Wellness campaigns" data-live-content>
      <div className={styles.carousel} role="region" aria-label="Campaign slides" aria-roledescription="carousel" tabIndex={0}
        onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
        onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault(); setPaused(true); move(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
        onTouchStart={(event) => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }}
        onTouchEnd={(event) => {
          const point = event.changedTouches[0]; const start = touch.current; touch.current = null;
          if (start && Math.abs(point.clientX - start.x) > 45 && Math.abs(point.clientX - start.x) > Math.abs(point.clientY - start.y)) {
            setPaused(true); move(point.clientX < start.x ? 1 : -1);
          }
        }}>
        <div className={`${styles.media}${isSidewaysSheaProductAsset(slide.src) ? ` ${styles.rotated}` : ''}`}>
          {slide.type === "video" ? <video key={slide.src} src={slide.src} muted playsInline loop autoPlay={!paused} />
            : <img key={slide.src} src={slide.src} alt={slide.tag} fetchPriority="high" style={{ objectPosition: slide.objectPosition ?? "center" }} />}
        </div>
        <div className={styles.copy} aria-live={paused ? "polite" : "off"}>
          <span>{slide.kicker}</span><h1>{slide.title}</h1><p>{slide.body}</p>
          <a href={slide.ctaHref}>{slide.ctaLabel}<ArrowRight size={18} /></a>
        </div>
        {slides.length > 1 && <div className={styles.controls}>
          <button type="button" onClick={() => { setPaused(true); move(-1); }} aria-label="Previous campaign slide"><ArrowLeft size={19} /></button>
          <div className={styles.dots}>{slides.map((item, position) => <button type="button" key={item.id} aria-label={`Campaign ${position + 1}`} aria-current={current === position ? "true" : undefined} onClick={() => { setPaused(true); setIndex(position); }} />)}</div>
          <span>{current + 1} / {slides.length}</span>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play campaigns" : "Pause campaigns"}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>
          <button type="button" onClick={() => { setPaused(true); move(1); }} aria-label="Next campaign slide"><ArrowRight size={19} /></button>
        </div>}
      </div>
    </section>
  );
}
