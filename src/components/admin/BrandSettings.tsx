"use client";
import { useState, type FormEvent } from "react";
import { Image, Save } from "lucide-react";
import { defaultBrandIdentity } from "@/components/storefront/BrandIdentity";
import type { BrandIdentity, PageOverrides } from "@/lib/page-editor";
import type { SheaMediaConfig } from "@/lib/shea-content";
import { uploadAdminMedia } from "@/lib/admin-media";
import { MediaLibraryPicker } from "./MediaLibraryPicker";
type Result = { success: true } | { success: false; message: string };
export function BrandSettings({ overrides, saveOverrides, media, saveMedia, ready }: {
  overrides: PageOverrides; saveOverrides: (value: PageOverrides) => Promise<Result>;
  media: SheaMediaConfig; saveMedia: (value: SheaMediaConfig) => Promise<Result>; ready: boolean;
}) {
  const [draft, setDraft] = useState<BrandIdentity>({ ...defaultBrandIdentity, ...overrides.__brand?.branding });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState<"logoUrl" | "footerLogoUrl" | null>(null);
  function change(key: keyof BrandIdentity, value: string) { setDraft(current => ({ ...current, [key]: value })); setMessage(""); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const result = await saveOverrides({ ...overrides, __brand: { ...overrides.__brand, branding: draft } });
      setMessage(result.success ? "Brand settings saved. Your name, logos and contact details apply across the storefront." : result.message);
    } catch { setMessage("Unable to save. Your changes are still here; please retry."); }
    finally { setBusy(false); }
  }
  return <section className="studio-identity"><header><span>BRAND FOUNDATIONS</span><h2>A consistent identity, everywhere.</h2><p>Manage the details customers see throughout your store.</p></header><form onSubmit={submit}>
    <div className="studio-brand-assets">{([{ key: "logoUrl", title: "Storefront logo" }, { key: "footerLogoUrl", title: "Footer logo" }] as const).map(item => <div key={item.key}><div>{draft[item.key] && <img src={draft[item.key]} alt={item.title} />}</div><strong>{item.title}</strong><button type="button" onClick={() => setPicker(item.key)} disabled={!ready || busy}><Image size={15} /> Choose or upload</button></div>)}</div>
    <fieldset disabled={busy || !ready}><div className="studio-identity-fields"><label>Store name<input required maxLength={120} value={draft.name} onChange={event => change("name", event.target.value)} /></label><label>Brand tagline<input maxLength={160} value={draft.tagline} onChange={event => change("tagline", event.target.value)} /></label><label>Contact email<input required type="email" value={draft.email} onChange={event => change("email", event.target.value)} /></label><label>Phone & WhatsApp<input required minLength={5} maxLength={40} value={draft.phone} onChange={event => change("phone", event.target.value)} /></label><label>Business address<input maxLength={500} value={draft.address} onChange={event => change("address", event.target.value)} /></label><label>Instagram address<input type="url" value={draft.instagramUrl} onChange={event => change("instagramUrl", event.target.value)} /></label><label className="studio-full-field">Announcement bar<input maxLength={200} value={draft.announcement} onChange={event => change("announcement", event.target.value)} /><small>Leave empty to hide the announcement.</small></label></div><button type="submit" className="studio-save"><Save size={15} />{busy ? "Saving…" : "Save brand settings"}</button></fieldset>
    {message && <p role="status">{message}</p>}
    </form>{picker && <MediaLibraryPicker assets={media.images} selectedSrc={draft[picker]} isLoading={!ready} onClose={() => setPicker(null)} onSelect={src => { change(picker, src); setPicker(null); }} onUploadFile={async file => {
      const src = await uploadAdminMedia(file);
      const result = await saveMedia({ ...media, images: [...media.images, { id: `brand_${crypto.randomUUID()}`, src, title: file.name, type: "image", tag: "Brand logos", fit: "contain" }] });
      if (!result.success) throw new Error(result.message);
      return src;
    }} />}</section>;
}
