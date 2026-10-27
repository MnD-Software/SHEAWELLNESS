"use client";
import { CAROUSEL_INTERVAL_MS } from "@/lib/carousel-timing";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";

export function AutoScrollRail({ label, children, kind }: { label: string; children: ReactNode; kind: "partners" | "results" }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {rootMargin: "80px"});
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const element = track.current;
    if (!element || !visible || paused || interacting || reduced) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const group = element.firstElementChild as HTMLElement | null;
      const card = group?.firstElementChild as HTMLElement | null;
      if (!group || !card) return;
      const gap = parseFloat(getComputedStyle(group).columnGap) || 20;
      const distance = group.offsetWidth + 20;
      if (element.scrollLeft >= distance - 1) {
        element.scrollTo({ left: element.scrollLeft - distance, behavior: "instant" });
      }
      element.scrollTo({ left: element.scrollLeft + card.offsetWidth + gap, behavior: "smooth" });
    }, CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, interacting, reduced, visible, kind]);
  function move(direction: number) {
    setPaused(true);
    track.current?.scrollBy({ left: direction * (kind === "partners" ? 210 : 340), behavior: reduced ? "instant" : "smooth" });
  }
  return <div className={`auto-rail auto-rail-${kind}`} role="region" aria-label={label} aria-roledescription="carousel"
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
    <div ref={track} className="auto-rail-track" tabIndex={0}
      onPointerDown={() => { setPaused(true); setInteracting(true); }}
      onPointerUp={() => setInteracting(false)} onPointerCancel={() => setInteracting(false)}
      onTouchStart={() => { setPaused(true); setInteracting(true); }} onTouchEnd={() => setInteracting(false)} onTouchCancel={() => setInteracting(false)}
      onWheel={() => setPaused(true)}
      onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      <div className="auto-rail-group" data-carousel-original>{children}</div>
      <div className="auto-rail-group" aria-hidden="true" inert data-carousel-copy>{children}</div>
    </div>
    <div className="auto-rail-controls"><button type="button" onClick={() => move(-1)} aria-label={`Previous ${label}`}><ArrowLeft size={17} /></button>
      <button type="button" onClick={() => { setPaused(value => !value); setInteracting(false); }} disabled={reduced} aria-label={`${paused ? "Play" : "Pause"} ${label}`}>{paused || reduced ? <Play size={16} /> : <Pause size={16} />}</button>
      <button type="button" onClick={() => move(1)} aria-label={`Next ${label}`}><ArrowRight size={17} /></button></div>
  </div>;
}
