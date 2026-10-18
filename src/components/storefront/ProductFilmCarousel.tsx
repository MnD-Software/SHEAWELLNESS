"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { prioritizeOwnerFilms } from "@/lib/client-media";
import type { SheaMediaAsset } from "@/lib/shea-content";

function FilmCard({ film, paused }: { film: SheaMediaAsset; paused: boolean }) {
  const card = useRef<HTMLElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.35 });
    if (card.current) observer.observe(card.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const video = player.current;
    if (!video) return;
    if (visible && !paused) void video.play().catch(() => undefined);
    else video.pause();
  }, [visible, paused]);
  return <article ref={card} className="product-film-card" aria-label={film.title}>
    <video ref={player} src={visible ? film.src : undefined} poster={film.poster || (film.src.startsWith("/assets/owner-oct-2026/") ? film.src.replace(".mp4", "-poster.webp") : undefined)} autoPlay={visible && !paused} muted loop playsInline controls preload="none" aria-label={film.title} />
  </article>;
}

export function ProductFilmCarousel({ films, children }: { films: SheaMediaAsset[]; children?: ReactNode }) {
  const ordered = prioritizeOwnerFilms(films);
  const rail = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [range, setRange] = useState({ start: 1, end: 1 });
  function move(delta: number) {
    const node = rail.current;
    if (!node) return;
    const step = (node.firstElementChild?.getBoundingClientRect().width ?? node.clientWidth) + 16;
    const max = node.scrollWidth - node.clientWidth;
    const next = delta > 0 && node.scrollLeft >= max - 2 ? 0 : delta < 0 && node.scrollLeft <= 2 ? max : Math.min(max, Math.max(0, node.scrollLeft + delta * step));
    node.scrollTo({ left: next, behavior: reducedMotion ? "instant" : "smooth" });
  }
  function updateRange() {
    const node = rail.current;
    if (!node) return;
    const step = (node.firstElementChild?.getBoundingClientRect().width ?? node.clientWidth) + 16;
    const start = Math.round(node.scrollLeft / step) + 1;
    setRange({ start, end: Math.min(ordered.length, start + Math.ceil(node.clientWidth / step) - 1) });
  }
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motion.matches);
    if (motion.matches) setPaused(true);
    const node = rail.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    const resize = new ResizeObserver(updateRange);
    observer.observe(node); resize.observe(node);
    return () => { observer.disconnect(); resize.disconnect(); };
  }, [ordered.length]);
  useEffect(() => {
    if (paused || interacting || !inView || ordered.length < 2) return;
    const timer = window.setInterval(() => move(1), 8000);
    return () => window.clearInterval(timer);
  }, [paused, interacting, inView, reducedMotion, ordered.length]);
  // Editorial cards keep their CMS-managed sources while sharing playback controls.
  useEffect(() => {
    const node = rail.current;
    if (!children || !node) return;
    const players = Array.from(node.querySelectorAll("video"));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const player = entry.target as HTMLVideoElement;
        const playing = entry.isIntersecting && entry.intersectionRatio >= 0.35 && !paused;
        player.autoplay = playing;
        if (playing) void player.play().catch(() => undefined);
        else player.pause();
      }
    }, { threshold: [0, 0.35] });
    for (const player of players) {
      player.pause();
      observer.observe(player);
    }
    return () => {
      observer.disconnect();
      players.forEach(player => player.pause());
    };
  }, [children, paused]);
  if (!ordered.length) return null;
  return <div className="product-film-carousel" role="region" aria-roledescription="carousel" aria-label="Shea Wellness product video carousel" data-live-content={children ? undefined : true}
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
    <div ref={rail} className="product-film-rail" tabIndex={0} aria-label="Slide through product videos" onScroll={updateRange} onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}>
      {/* Existing editorial cards retain their saved text and video editor slots. */}
      {children ?? ordered.map(film => <FilmCard key={film.src} film={film} paused={paused} />)}
    </div>
    <div className="product-film-carousel-controls" data-cms-exclude={children ? true : undefined}>
      <span>{range.start}–{range.end} / {ordered.length} videos</span>
      <div><button type="button" onClick={() => move(-1)} aria-label="Previous videos"><ChevronLeft size={20} /></button>
        <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Play video carousel" : "Pause video carousel"}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
        <button type="button" onClick={() => move(1)} aria-label="Next videos"><ChevronRight size={20} /></button></div>
    </div>
  </div>;
}
