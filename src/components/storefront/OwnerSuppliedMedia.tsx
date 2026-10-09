import { ownerAsset, ownerDownloads, ownerVideos } from "@/lib/owner-media";
import { partnerLogos } from "@/lib/shea-website-content";
import { StorefrontImage } from "./StorefrontImage";

export function OwnerPartners() {
  return <div className="owner-partner-grid">{partnerLogos.map(([name, file]) => <figure key={name}><StorefrontImage src={ownerAsset(`partner-${file.match(/\d+/)?.[0].padStart(2, "0")}.webp`)} alt={name} loading="lazy" /><figcaption>{name}</figcaption></figure>)}</div>;
}
export function OwnerDownloads() {
  return <section className="owner-resources" aria-label="Download Shea Wellness brochures"><header><span>Explore the collection</span><h2>Brochures to keep and share.</h2></header><div>{ownerDownloads.map(item => <article key={item.file}><a href={ownerAsset(item.file)} target="_blank" rel="noreferrer" aria-label={`Open ${item.title}`}><StorefrontImage src={ownerAsset(item.cover)} alt={`${item.title} cover`} loading="lazy" /></a><div><small>{item.detail}</small><h3>{item.title}</h3><p>{item.body}</p><a href={ownerAsset(item.file)} download>Download PDF</a><a href={ownerAsset(item.file)} target="_blank" rel="noreferrer">View brochure</a></div></article>)}</div></section>;
}
export function OwnerProductFilms() {
  return <section className="owner-films" aria-label="Shea Wellness product films"><header><span>Closer to the collection</span><h2>See our products in motion.</h2></header><div>{ownerVideos.map(([title,file]) => <article key={file}><video src={ownerAsset(file)} poster={ownerAsset(file.replace('.mp4','-poster.webp'))} controls playsInline preload="none" aria-label={title} /><h3>{title}</h3></article>)}</div></section>;
}
export function OwnerRoutineProgress() {
  return <section className="owner-progress" aria-label="Customer routine photographs"><header><span>Routine milestones</span><h2>Customer routine photographs.</h2><p>Before-and-after photographs supplied by Shea Wellness. Individual results vary.</p></header><div>{[["progress-face-1.webp", "Facial care"], ["progress-face-2.webp", "Skin care"], ["progress-heels.webp", "Heel care"], ["progress-hands.webp", "Hand care"]].map(([file,title]) => <figure key={file}><StorefrontImage src={ownerAsset(file)} alt={`${title}: before and after comparison supplied by Shea Wellness`} loading="lazy" /><figcaption>{title}</figcaption></figure>)}</div></section>;
}
