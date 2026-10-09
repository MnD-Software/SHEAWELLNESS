"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import type { SheaHeroSlide } from "@/lib/shea-content";
import styles from "./CampaignCarousel.module.css";
import { clearPresetImage } from "@/lib/shea-media";

export function CampaignCarousel({ slides }: { slides: SheaHeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const current = index % Math.max(slides.length, 1);
  const slide = slides[current];
  const source = clearPresetImage(slide?.src);
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
  useEffect(() => {
    if (!video.current) return;
    if (paused || interacting) video.current.pause();
    else void video.current.play().catch(() => undefined);
  }, [paused, interacting, source]);
  if (!slide) return null;
  return (
    <section className={styles.section} aria-label="Shea Wellness campaigns" data-live-content>
      <div className={`${styles.carousel}${source ? "" : ` ${styles.empty}`}`} role="region" aria-label="Campaign slides" aria-roledescription="carousel" tabIndex={0}
        onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
        onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault(); setPaused(true); move(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
        onTouchStart={(event) => { const point = event.touches[0]; if (point) touch.current = { x: point.clientX, y: point.clientY }; }}
        onTouchCancel={() => { touch.current = null; }}
        onTouchEnd={(event) => {
          const point = event.changedTouches[0]; const start = touch.current; touch.current = null;
          if (point && start && Math.abs(point.clientX - start.x) > 45 && Math.abs(point.clientX - start.x) > Math.abs(point.clientY - start.y)) {
            setPaused(true); move(point.clientX < start.x ? 1 : -1);
          }
        }}>
        <div className={styles.media} data-testid="campaign-stage" role="group" aria-roledescription="slide" aria-label={`${current + 1} of ${slides.length}: ${slide.title}`}>
          {source ? slide.type === "video" ? <video ref={video} key={source} src={source} muted playsInline loop autoPlay={!paused} />
            : <img key={source} src={source} alt={slide.tag || slide.title} fetchPriority="high" style={{ objectPosition: slide.objectPosition ?? "center" }} /> : null}
        </div>
        <div className={styles.copy} key={slide.id} aria-live={paused ? "polite" : "off"} aria-atomic="true">
          <span>{slide.kicker}</span><h1>{slide.title}</h1><p>{slide.body}</p>
          <a href={slide.ctaHref}>{slide.ctaLabel}<ArrowRight size={18} /></a>
        </div>
        {slides.length > 1 && <>
          <button className={`${styles.arrow} ${styles.previous}`} type="button" onClick={() => { setPaused(true); move(-1); }} aria-label="Previous campaign slide"><ArrowLeft size={20} /></button>
          <button className={`${styles.arrow} ${styles.next}`} type="button" onClick={() => { setPaused(true); move(1); }} aria-label="Next campaign slide"><ArrowRight size={20} /></button>
          <div className={styles.controls}>
          <div className={styles.dots}>{slides.map((item, position) => <button type="button" key={item.id} aria-label={`Campaign ${position + 1}`} aria-current={current === position ? "true" : undefined} onClick={() => { setPaused(true); setIndex(position); }} />)}</div>
          <span>{current + 1} / {slides.length}</span>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play campaigns" : "Pause campaigns"}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>
          </div>
        </>}
      </div>
    </section>
  );
}
