"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Image, Layers, Link, Monitor, MousePointer2, RotateCcw, Save, Search, Smartphone, Tablet, Type, Video } from "lucide-react";
import { applyContentOverride, editorNodes, isProtectedElement, safeDestination, type EditorKind, type ElementAppearance, type PageContentOverride, type PageOverrides } from "@/lib/page-editor";
import type { SheaMediaConfig } from "@/lib/shea-content";
import { MediaLibraryPicker } from "./MediaLibraryPicker";
import { uploadAdminMedia } from "@/lib/admin-media";

type Element = { kind: EditorKind; index: number; label: string; group: string; value: string; extra: string; appearance: ElementAppearance };
type SaveResult = { success: true } | { success: false; message: string };
const kinds = [{ id: "text", label: "Copy", icon: Type }, { id: "image", label: "Images", icon: Image }, { id: "link", label: "Links", icon: Link }, { id: "video", label: "Video", icon: Video }, { id: "section", label: "Sections", icon: Layers }] as const;
const devices = [{ id: "desktop", label: "Desktop", icon: Monitor }, { id: "tablet", label: "Tablet", icon: Tablet }, { id: "mobile", label: "Mobile", icon: Smartphone }] as const;

export function SitePageEditor({ page, overrides, saveOverrides, media, mediaReady, saveMedia, onClose }: {
  page: { title: string; route: string }; overrides: PageOverrides;
  saveOverrides: (value: PageOverrides) => Promise<SaveResult>; media: SheaMediaConfig; mediaReady: boolean;
  saveMedia: (value: SheaMediaConfig) => Promise<SaveResult>; onClose: () => void;
}) {
  const global = page.route === "__global";
  const iframe = useRef<HTMLIFrameElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const baseline = useRef<Element[]>([]);
  const [elements, setElements] = useState<Element[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [kind, setKind] = useState<EditorKind>("text");
  const [query, setQuery] = useState("");
  const [device, setDevice] = useState("desktop");
  const [draft, setDraft] = useState<PageContentOverride>(overrides[page.route] ?? {});
  const draftRef = useRef(draft);
  const [past, setPast] = useState<PageContentOverride[]>([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState(false);
  const active = elements.find(item => `${item.kind}:${item.index}` === selected);
  const filtered = elements.filter(item => item.kind === kind && `${item.label} ${item.value} ${item.group}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);

  function inspect() {
    const document = iframe.current?.contentDocument;
    if (!document) return;
    document.querySelectorAll<HTMLElement>("[data-brand-logo]").forEach(node => {
      const key = node.dataset.brandLogo as "logoUrl" | "footerLogoUrl";
      const src = overrides.__brand?.branding?.[key];
      if (src !== undefined) { if (src) node.setAttribute("src", src); else node.removeAttribute("src"); }
    });
    nodes.current.clear();
    const items: Element[] = [];
    for (const { id } of kinds) editorNodes(document, id, global).forEach((node, index) => {
      if (id !== "section" && isProtectedElement(node)) return;
      const key = `${id}:${index}`;
      const section = node.closest("section,footer,header");
      const group = section?.getAttribute("aria-label") || section?.querySelector("h1,h2,h3")?.textContent?.trim().slice(0, 65) || (global ? (node.closest("footer") ? "Footer" : "Header & navigation") : "Page content");
      const value = id === "image" || id === "video" ? node.getAttribute("src") || "" : id === "link" ? node.getAttribute("href") || "" : id === "section" ? group : node.textContent?.trim() || "";
      const extra = id === "link" ? node.textContent?.trim() || "" : id === "video" ? node.getAttribute("poster") || "" : "";
      const label = id === "image" ? node.dataset.imageLabel || node.getAttribute("alt") || "Image" : id === "section" ? group : id === "video" ? node.getAttribute("aria-label") || "Product film" : (id === "link" ? extra : value).slice(0, 65) || node.tagName;
      const item: Element = { kind: id, index, label, group, value, extra, appearance: id === "image" ? { alt: node.getAttribute("alt") || "", fit: node.style.objectFit === "cover" ? "cover" : "contain", position: node.style.objectPosition || "50% 50%" } : {} };
      items.push(item); nodes.current.set(key, node);
      node.dataset.cmsKey = key;
    });
    baseline.current = structuredClone(items);
    applyContentOverride(document, overrides.__global, true, overrides.__brand?.branding);
    if (!global) applyContentOverride(document, overrides[page.route]);
    applyContentOverride(document, draftRef.current, global);
    refreshElements(items, draftRef.current);
    const style = document.createElement("style");
    style.textContent = "[data-cms-key]{cursor:crosshair!important;outline-offset:3px} [data-cms-key]:hover{outline:1px dashed #ae8b51!important} [data-cms-selected]{outline:2px solid #ae8b51!important} .shea-whatsapp-chat{display:none!important}";
    document.head.appendChild(style);
    document.addEventListener("click", event => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cms-key]");
      event.preventDefault(); event.stopPropagation();
      if (target?.dataset.cmsKey) choose(target.dataset.cmsKey);
    }, true);
    document.addEventListener("submit", event => event.preventDefault(), true);
    setReady(true);
  }

  function refreshElements(items: Element[], value: PageContentOverride) {
    setElements(items.map(item => {
      const index = String(item.index);
      const appearance = { ...item.appearance, ...value.appearance?.[`${item.kind}:${index}`] };
      return { ...item, appearance,
        value: item.kind === "text" ? value.texts?.[index] ?? item.value : item.kind === "image" ? value.images?.[index] ?? item.value : item.kind === "link" ? value.links?.[index]?.href ?? item.value : item.kind === "video" ? value.videos?.[index]?.src ?? item.value : item.value,
        extra: item.kind === "link" ? value.links?.[index]?.label ?? item.extra : item.kind === "video" ? value.videos?.[index]?.poster ?? item.extra : item.extra
      };
    }));
  }

  function loadPreview() {
    const document = iframe.current?.contentDocument;
    if (!document) return;
    const hydrated = document.documentElement.dataset.cmsHydrated === "true";
    const awaitingContent = document.querySelector<HTMLElement>("main")?.dataset.cmsContentReady === "false";
    if (hydrated && !awaitingContent) inspect();
    else {
      if (!hydrated) iframe.current?.contentWindow?.addEventListener("shea-cms-hydrated", loadPreview, { once: true });
      if (awaitingContent) iframe.current?.contentWindow?.addEventListener("shea-content-ready", loadPreview, { once: true });
    }
  }

  function choose(key: string) {
    setSelected(key); setKind(key.split(":")[0] as EditorKind);
    nodes.current.forEach((node, nodeKey) => { if (nodeKey === key) node.dataset.cmsSelected = "true"; else delete node.dataset.cmsSelected; });
    nodes.current.get(key)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function change(patch: Partial<Element>) {
    if (!active) return;
    const next = { ...active, ...patch };
    const index = String(next.index);
    const value = structuredClone(draft);
    if (next.kind === "text") value.texts = { ...value.texts, [index]: next.value };
    if (next.kind === "image") value.images = { ...value.images, [index]: next.value };
    if (next.kind === "link") value.links = { ...value.links, [index]: { href: next.value, label: next.extra } };
    if (next.kind === "video") value.videos = { ...value.videos, [index]: { src: next.value, poster: next.extra } };
    if (patch.appearance) value.appearance = { ...value.appearance, [`${next.kind}:${index}`]: next.appearance };
    setPast(items => [...items.slice(-29), draft]); setDraft(value); draftRef.current = value; setDirty(true); setMessage("");
    refreshElements(baseline.current, value);
    if (iframe.current?.contentDocument) applyContentOverride(iframe.current.contentDocument, value, global);
  }

  function appearance(patch: Partial<ElementAppearance>) { if (active) change({ appearance: { ...active.appearance, ...patch } }); }
  function undo() {
    const previous = past.at(-1); if (!previous) return;
    setPast(items => items.slice(0, -1)); setDraft(previous); draftRef.current = previous; setDirty(true); setMessage("");
    // Reload also restores attributes/styles removed by undo, with the draft retained.
    setReady(false); iframe.current?.contentWindow?.location.reload();
  }

  async function save() {
    const submitted = draft;
    for (const item of elements.filter(item => item.kind === "link" || item.kind === "image" || item.kind === "video")) {
      if (safeDestination(item.value, item.kind !== "link") === null || (item.kind === "video" && safeDestination(item.extra, true) === null)) { setMessage(`Check the address for “${item.label}”. Use a site path or a full https:// address.`); return; }
    }
    setBusy(true); setMessage("");
    try {
      const nextOverrides = { ...overrides, [page.route]: structuredClone(draft) };
      if (global) {
        const shared = nextOverrides.__global;
        const branding = { ...overrides.__brand?.branding };
        // Both logo editors persist to one stable identity key, across all routes.
        for (const [index, src] of Object.entries(shared.images ?? {})) {
          const key = nodes.current.get(`image:${index}`)?.dataset.brandLogo;
          if (key !== "logoUrl" && key !== "footerLogoUrl") continue;
          branding[key] = src;
          delete shared.images?.[index];
        }
        nextOverrides.__brand = { ...overrides.__brand, branding };
      }
      const result = await saveOverrides(nextOverrides);
      if (!result.success) { setMessage(result.message); return; }
      if (draftRef.current === submitted) { setDirty(false); setPast([]); setMessage("Published. Your changes are saved for every visitor."); }
      else setMessage("Earlier changes were saved. Publish again to include your latest edits.");
    } catch { setMessage("Changes could not be saved. Your draft is still here; please retry."); }
    finally { setBusy(false); }
  }

  return <section className="studio-editor" data-studio-dirty={dirty}>
    <header className="studio-heading"><div><button type="button" onClick={() => { if (!dirty || window.confirm("Leave this page and discard unsaved changes?")) onClose(); }}><ArrowLeft size={16} /> All pages</button><p>WEBSITE STUDIO <ChevronRight size={12} /> {global ? "Shared branding" : page.title}</p><h1>{page.title}</h1></div><span className="studio-status"><i className={dirty ? "unsaved" : ""} />{dirty ? "Unsaved changes" : "Saved content"}</span></header>
    <div className="studio-toolbar"><div className="studio-devices" aria-label="Preview size">{devices.map(item => <button key={item.id} type="button" aria-label={`${item.label} preview`} aria-pressed={device === item.id} onClick={() => setDevice(item.id)}><item.icon size={17} /><span>{item.label}</span></button>)}</div><div><button type="button" onClick={undo} disabled={!past.length || busy} aria-label="Undo last change"><RotateCcw size={15} /> Undo</button><button className="studio-save" type="button" onClick={save} disabled={!ready || busy || !dirty || !mediaReady}><Save size={16} />{busy ? "Publishing…" : "Save page changes"}</button></div></div>
    {message && <p className={`studio-message ${dirty ? "error" : ""}`} role={dirty ? "alert" : "status"}>{!dirty && <Check size={16} />}{message}</p>}
    <div className="studio-layout">
      <aside className="studio-inspector">
        <header><span>CONTENT & DESIGN</span><h2>Make it yours.</h2><p>Select an element here or click it in the preview.</p></header>
        <div className="studio-tabs" role="tablist" aria-label="Element type">{kinds.map(item => <button key={item.id} type="button" role="tab" aria-selected={kind === item.id} onClick={() => { setKind(item.id); setSelected(null); }}><item.icon size={16} /><span>{item.label}</span></button>)}</div>
        <label className="studio-search"><Search size={15} /><input aria-label="Find an element" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find an element…" /></label>
        {active ? <div className="studio-properties">
          <button type="button" className="studio-back" onClick={() => setSelected(null)}><ArrowLeft size={14} /> Back to {kinds.find(item => item.id === kind)?.label.toLowerCase()}</button><small>{active.group}</small><h3>{active.label}</h3>
          {active.kind === "text" && <label>Text content<textarea aria-label="Text content" rows={5} value={active.value} onChange={event => change({ value: event.target.value })} /></label>}
          {active.kind === "image" && <><div className="studio-image-preview">{active.value ? <img src={active.value} alt={active.appearance.alt || active.label} /> : <Image size={32} />}</div><button type="button" className="studio-choose" onClick={() => setPicker(true)}><Image size={16} /> Choose or upload image</button><label>Image address<input value={active.value} onChange={event => change({ value: event.target.value })} /></label><label>Image description<input value={active.appearance.alt || ""} onChange={event => appearance({ alt: event.target.value })} /></label><label>Image fitting<select value={active.appearance.fit || "contain"} onChange={event => appearance({ fit: event.target.value as "contain" | "cover" })}><option value="contain">Fit the whole image</option><option value="cover">Fill the frame</option></select></label><label>Focal point<select value={active.appearance.position || "50% 50%"} onChange={event => appearance({ position: event.target.value })}><option value="50% 50%">Centre</option><option value="50% 0%">Top</option><option value="50% 100%">Bottom</option><option value="0% 50%">Left</option><option value="100% 50%">Right</option></select></label><button type="button" className="studio-remove" onClick={() => change({ value: "" })}>Remove image</button></>}
          {active.kind === "link" && <><label>Button or link label<input value={active.extra} onChange={event => change({ extra: event.target.value })} /></label><label>Destination<input value={active.value} onChange={event => change({ value: event.target.value })} placeholder="/shop or https://…" /></label><p>Site paths, web addresses, email and telephone links are supported.</p></>}
          {active.kind === "video" && <><label>Video address<input value={active.value} onChange={event => change({ value: event.target.value })} /></label><label>Cover image address<input value={active.extra} onChange={event => change({ extra: event.target.value })} /></label><button type="button" onClick={() => setPicker(true)}>Choose cover image</button></>}
          {active.kind === "section" && <><label className="studio-toggle"><input type="checkbox" checked={!active.appearance.hidden} onChange={event => appearance({ hidden: !event.target.checked })} /><span>Show this section</span></label><label>Vertical padding<input type="range" min="0" max="160" step="4" value={active.appearance.spacing || "40"} onChange={event => appearance({ spacing: event.target.value })} /><small>{active.appearance.spacing || "Theme default"}{active.appearance.spacing ? " px" : ""}</small></label></>}
          {(active.kind === "text" || active.kind === "link" || active.kind === "section") && <><label>Text alignment<select value={active.appearance.align || "left"} onChange={event => appearance({ align: event.target.value as ElementAppearance["align"] })}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label><div className="studio-color-row"><label>Text colour<input aria-label="Text colour" type="color" value={active.appearance.color || "#173d2b"} onChange={event => appearance({ color: event.target.value })} /></label><label>Background<input aria-label="Background colour" type="color" value={active.appearance.background || "#faf9f5"} onChange={event => appearance({ background: event.target.value })} /></label></div></>}
          {active.kind === "text" && <label>Text size<input type="number" min="10" max="120" placeholder="Theme default" value={active.appearance.fontSize || ""} onChange={event => appearance({ fontSize: event.target.value })} /></label>}
        </div> : <div className="studio-elements">{!ready ? <p role="status">Loading your page…</p> : !filtered.length ? <p>No {kind} elements found. Campaign slides and product details have their own editors in Media library and Products.</p> : filtered.map(item => <button type="button" key={`${item.kind}:${item.index}`} onClick={() => choose(`${item.kind}:${item.index}`)}><span><small>{item.group}</small><strong>{item.label}</strong>{item.kind === "image" && <em>{item.value ? "Image assigned" : "Empty image slot"}</em>}{item.kind === "section" && <em>{item.appearance.hidden ? "Hidden" : "Visible"}</em>}</span><ChevronRight size={15} /></button>)}</div>}
        <footer><MousePointer2 size={14} /><span>Preview changes instantly. Publish when you’re ready.</span></footer>
      </aside>
      <div className={`studio-preview studio-preview-${device}`}><div className="studio-browser-bar"><i /><i /><i /><span>sheawellness / {global ? "shared branding" : page.route === "/" ? "home" : page.route.slice(1)}</span></div><iframe ref={iframe} src={`${global ? "/" : page.route}?cmsPreview=1`} title={`${page.title} live preview`} onLoad={loadPreview} /></div>
    </div>
    {picker && active && <MediaLibraryPicker assets={[...media.heroSlides, ...media.images]} isLoading={!mediaReady} selectedSrc={active.kind === "video" ? active.extra : active.value} onClose={() => setPicker(false)} onSelect={src => { change(active.kind === "video" ? { extra: src } : { value: src }); setPicker(false); }} onUploadFile={async file => {
      const src = await uploadAdminMedia(file);
      const result = await saveMedia({ ...media, images: [...media.images, { id: `page_${crypto.randomUUID()}`, title: file.name, src, type: "image", tag: "Page image" }] });
      if (!result.success) throw new Error(result.message);
      return src;
    }} />}
  </section>;
}
