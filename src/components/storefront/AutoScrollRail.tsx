"use client";
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
    let frame = 0; let previous = 0; let position = element.scrollLeft;
    const animate = (time: number) => {
      if (previous && document.visibilityState === "visible") {
        position += Math.min(time - previous, 50) * (kind === "partners" ? 0.035 : 0.025);
        const group = element.firstElementChild as HTMLElement | null;
        const distance = group ? group.offsetWidth + 20 : 0;
        if (distance && position >= distance) position -= distance;
        element.scrollLeft = position;
      }
      previous = time; frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [paused, interacting, reduced, visible, kind]);
  function move(direction: number) {
    setPaused(true);
    track.current?.scrollBy({ left: direction * (kind === "partners" ? 210 : 340), behavior: reduced ? "instant" : "smooth" });
  }
  return <div className={`auto-rail auto-rail-${kind}`} role="region" aria-label={label} aria-roledescription="carousel"
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
    <div ref={track} className="auto-rail-track" tabIndex={0} onTouchStart={() => setInteracting(true)} onTouchEnd={() => setInteracting(false)} onTouchCancel={() => setInteracting(false)}
      onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      <div className="auto-rail-group" data-carousel-original>{children}</div>
      <div className="auto-rail-group" aria-hidden="true" inert data-carousel-copy>{children}</div>
    </div>
    <div className="auto-rail-controls"><button type="button" onClick={() => move(-1)} aria-label={`Previous ${label}`}><ArrowLeft size={17} /></button>
      <button type="button" onClick={() => setPaused(value => !value)} disabled={reduced} aria-label={`${paused ? "Play" : "Pause"} ${label}`}>{paused || reduced ? <Play size={16} /> : <Pause size={16} />}</button>
      <button type="button" onClick={() => move(1)} aria-label={`Next ${label}`}><ArrowRight size={17} /></button></div>
  </div>;
}
