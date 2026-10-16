"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { prioritizeOwnerFilms } from "@/lib/client-media";
import type { SheaMediaAsset } from "@/lib/shea-content";

export function ProductFilmSlideshow({ films }: { films: SheaMediaAsset[] }) {
  const ordered = prioritizeOwnerFilms(films);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const current = index % Math.max(ordered.length, 1);
  const film = ordered[current];
  const move = (delta: number) => setIndex(value => (value + delta + ordered.length) % Math.max(ordered.length, 1));
  useEffect(() => {
    const player = video.current;
    if (!player) return;
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) player.pause();
    else void player.play().catch(() => undefined);
  }, [paused, film?.src]);
  if (!film) return null;
  return <div className="product-film-slideshow" role="region" aria-roledescription="carousel" aria-label="Shea Wellness product video slideshow" data-live-content>
    <div className="product-film-stage" role="group" aria-roledescription="slide" aria-label={`${current + 1} of ${ordered.length}: ${film.title}`}>
      <video ref={video} key={film.src} src={film.src} poster={film.poster || (film.src.startsWith("/assets/owner-oct-2026/") ? film.src.replace(".mp4", "-poster.webp") : undefined)} muted playsInline controls preload="metadata" onEnded={() => { if (!paused) move(1); }} aria-label={film.title} />
      <strong>{film.title}</strong>
    </div>
    <div className="product-film-controls">
      <button type="button" onClick={() => move(-1)} aria-label="Previous product film"><ChevronLeft size={20} /></button>
      <span>{current + 1} / {ordered.length}</span>
      <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Play product slideshow" : "Pause product slideshow"}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
      <button type="button" onClick={() => move(1)} aria-label="Next product film"><ChevronRight size={20} /></button>
    </div>
  </div>;
}
