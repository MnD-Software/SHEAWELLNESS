export type ElementAppearance = {
  color?: string; background?: string; align?: "left" | "center" | "right";
  fontSize?: string; spacing?: string; hidden?: boolean;
  alt?: string; fit?: "contain" | "cover"; position?: string;
};
export type PageContentOverride = {
  branding?: Partial<BrandIdentity>;
  texts?: Record<string, string>; images?: Record<string, string>;
  links?: Record<string, { href: string; label?: string }>;
  videos?: Record<string, { src: string; poster?: string }>;
  appearance?: Record<string, ElementAppearance>;
};
export type BrandIdentity = { name: string; tagline: string; email: string; phone: string; address: string; announcement: string; logoUrl: string; footerLogoUrl: string; instagramUrl: string };
export type PageOverrides = Record<string, PageContentOverride>;
export type EditorKind = "text" | "image" | "link" | "video" | "section";
export const legacyTextSelector = "main h1, main h2, main h3, main h4, main p, main li, main blockquote, main figcaption";
const protectedContent = "[data-live-content], .department-product-carousel, .shop-product-card, .commerce-product-card, .commerce-checkout, .commerce-cart, [role=dialog]";
// Sections can move on the page while keeping the owner's saved editor slots.
function inEditorOrder(nodes: HTMLElement[]) {
  const order = (node: HTMLElement) => Number(node.closest<HTMLElement>("[data-cms-order]")?.dataset.cmsOrder ?? 3);
  return nodes.sort((a, b) => order(a) - order(b));
}
export function editorNodes(root: ParentNode, kind: EditorKind, global = false): HTMLElement[] {
  const containers = Array.from(root.querySelectorAll<HTMLElement>(global ? "header[data-testid=global-header], footer.shea-commerce-footer, .shea-desktop-sidebar" : "main"));
  let nodes: HTMLElement[] = [];
  const selector = kind === "text" ? "h1,h2,h3,h4,p,li,blockquote,figcaption,span,strong,small,label,summary" : kind === "image" ? "img" : kind === "link" ? "a[href]" : kind === "video" ? "video" : "section";
  for (const container of containers) nodes.push(...Array.from(container.querySelectorAll<HTMLElement>(selector)));
  nodes = [...new Set(nodes)].filter(node => !node.closest("[data-cms-exclude]"));
  if (!global) nodes = inEditorOrder(nodes);
  if (kind === "text" && !global) {
    const legacy = inEditorOrder(Array.from(root.querySelectorAll<HTMLElement>(legacyTextSelector)).filter(node => !node.closest("[data-cms-exclude]")));
    nodes = [...legacy, ...nodes.filter(node => !legacy.includes(node) && !node.children.length)];
  } else if (kind === "text") nodes = nodes.filter(node => !node.children.length);
  return nodes;
}
export function isProtectedElement(node: HTMLElement) {
  return !!node.closest(protectedContent) || (node.tagName !== "IMG" && !!node.querySelector(node.tagName === "A" ? "input,button,video,img" : "a,input,button,svg,video,img")) || (node.tagName === "LI" && !!node.children.length);
}
export function safeDestination(value: string, media = false) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\/(?!\/)/.test(trimmed) || (!media && /^#/.test(trimmed))) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || (!media && /^(mailto:|tel:)/i.test(trimmed))) return trimmed;
  return null;
}
export function applyAppearance(node: HTMLElement, value: ElementAppearance, kind: EditorKind) {
  if (value.hidden !== undefined) { node.hidden = value.hidden; if (value.hidden) node.style.setProperty("display", "none", "important"); else node.style.removeProperty("display"); }
  if (value.color !== undefined) node.style.setProperty("color", value.color, "important");
  if (value.background !== undefined) node.style.setProperty("background-color", value.background, "important");
  if (value.align !== undefined) node.style.setProperty("text-align", value.align, "important");
  if (value.fontSize !== undefined) node.style.setProperty("font-size", value.fontSize ? `${value.fontSize}px` : "", "important");
  if (value.spacing !== undefined) { node.style.setProperty("padding-top", value.spacing ? `${value.spacing}px` : "", "important"); node.style.setProperty("padding-bottom", value.spacing ? `${value.spacing}px` : "", "important"); }
  if (kind === "image") {
    if (value.alt !== undefined) node.setAttribute("alt", value.alt);
    if (value.fit !== undefined) node.style.setProperty("object-fit", value.fit, "important");
    if (value.position !== undefined) node.style.setProperty("object-position", value.position, "important");
  }
}
export function applyContentOverride(root: ParentNode, page: PageContentOverride | undefined, global = false, branding?: Partial<BrandIdentity>) {
  if (!page) return;
  for (const [kind, entries] of [["text", page.texts], ["image", page.images], ["link", page.links], ["video", page.videos]] as const) {
    const nodes = editorNodes(root, kind, global);
    Object.entries(entries ?? {}).forEach(([key, value]) => {
      const node = nodes[Number(key)];
      if (!node || isProtectedElement(node)) return;
      // Logo choices in brand settings take precedence over historic image indices.
      if (kind === "image" && node.dataset.brandLogo && branding?.[node.dataset.brandLogo as "logoUrl" | "footerLogoUrl"] !== undefined) return;
      if (kind === "text" && typeof value === "string" && node.textContent !== value) node.textContent = value;
      if (kind === "image" && typeof value === "string" && safeDestination(value, true) !== null && node.getAttribute("src") !== (value || null)) {
        node.removeAttribute("srcset");
        if (value) node.setAttribute("src", value); else node.removeAttribute("src");
      }
      if (kind === "link" && typeof value === "object" && "href" in value) {
        const href = safeDestination(value.href);
        if (href !== null && node.getAttribute("href") !== href) node.setAttribute("href", href);
        if (value.label !== undefined && node.textContent !== value.label) {
          const text = Array.from(node.childNodes).find(child => child.nodeType === 3 && child.textContent?.trim());
          if (text) text.textContent = value.label; else if (!node.children.length) node.textContent = value.label;
        }
      }
      if (kind === "video" && typeof value === "object" && "src" in value) {
        if (safeDestination(value.src, true) !== null && node.getAttribute("src") !== value.src) { if (value.src) node.setAttribute("src", value.src); else node.removeAttribute("src"); }
        if (value.poster !== undefined && safeDestination(value.poster, true) !== null) { if (value.poster) node.setAttribute("poster", value.poster); else node.removeAttribute("poster"); }
      }
    });
  }
  Object.entries(page.appearance ?? {}).forEach(([key, value]) => {
    const [kind, index] = key.split(":") as [EditorKind, string];
    if (!["text", "image", "link", "video", "section"].includes(kind)) return;
    const node = editorNodes(root, kind, global)[Number(index)];
    if (node && (kind === "section" || !isProtectedElement(node))) applyAppearance(node, value, kind);
  });
}
