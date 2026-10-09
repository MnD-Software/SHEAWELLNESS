import type { CSSProperties } from "react";
import type { SheaMediaAsset, SheaMediaConfig } from "@/lib/shea-content";
import { StorefrontImage } from "./StorefrontImage";
import { AutoScrollRail } from "./AutoScrollRail";

function imageStyle(asset: SheaMediaAsset): CSSProperties {
  return { objectPosition: asset.objectPosition ?? "center", transform: asset.rotation ? `rotate(${asset.rotation}deg)` : undefined };
}

export function OwnerPartners({ media }: { media: SheaMediaConfig }) {
  const partners = media.images.filter(item => item.placements?.includes("partners"));
  if (!partners.length) return null;
  return <div className="owner-partner-grid"><AutoScrollRail label="partner logos" kind="partners">{partners.map(asset => <figure key={asset.id}><StorefrontImage src={asset.src} alt={asset.alt || asset.title} loading="lazy" style={imageStyle(asset)} /><figcaption>{asset.title}</figcaption></figure>)}</AutoScrollRail></div>;
}
export function OwnerDownloads({ media }: { media: SheaMediaConfig }) {
  const downloads = (media.documents ?? []).filter(item => item.placements?.includes("downloads"));
  if (!downloads.length) return null;
  return <section className="owner-resources" aria-label="Download Shea Wellness brochures"><header><span>Explore the collection</span><h2>Brochures to keep and share.</h2></header><div>{downloads.map(item => <article key={item.id}>{item.poster && <a href={item.src} target="_blank" rel="noreferrer" aria-label={`Open ${item.title}`}><StorefrontImage src={item.poster} alt={`${item.title} cover`} loading="lazy" /></a>}<div><small>{item.tag || "PDF brochure"}</small><h3>{item.title}</h3><a href={item.src} download>Download PDF</a><a href={item.src} target="_blank" rel="noreferrer">View brochure</a></div></article>)}</div></section>;
}
export function OwnerProductFilms({ media }: { media: SheaMediaConfig }) {
  const films = media.videos.filter(item => item.placements?.includes("films"));
  if (!films.length) return null;
  return <section className="owner-films" aria-label="Shea Wellness product films"><header><span>Closer to the collection</span><h2>See our products in motion.</h2></header><div>{films.map(item => <article key={item.id}><video src={item.src} poster={item.poster || (item.src.startsWith("/assets/owner-oct-2026/") ? item.src.replace('.mp4','-poster.webp') : undefined)} controls playsInline preload="none" aria-label={item.title} /><h3>{item.title}</h3></article>)}</div></section>;
}
export function OwnerRoutineProgress({ media }: { media: SheaMediaConfig }) {
  const photos = media.images.filter(item => item.placements?.includes("beforeAfter"));
  if (!photos.length) return null;
  return <section className="owner-progress" aria-label="Before and after"><header><span>Routine milestones</span><h2>Before &amp; after.</h2><p>Photographs supplied by Shea Wellness. Individual results vary.</p></header><AutoScrollRail label="before and after" kind="results">{photos.map(asset => <figure key={asset.id}><StorefrontImage src={asset.src} alt={asset.alt || "Before and after comparison supplied by Shea Wellness"} loading="lazy" style={imageStyle(asset)} /><figcaption>Before &amp; after</figcaption></figure>)}</AutoScrollRail></section>;
}
