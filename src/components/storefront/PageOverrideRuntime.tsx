"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { applyContentOverride } from "@/lib/page-editor";
import type { PageOverrides } from "@/server/repositories/storeContentRepository";
import { useStorefrontContent } from "./StorefrontContent";

export const editableTextSelector = "main h1, main h2, main h3, main h4, main p, main li, main blockquote, main figcaption";
export const editableImageSelector = "main img";

export function applyPageOverrides(pageOverrides: PageOverrides, path = window.location.pathname, root: ParentNode = document) {
  applyContentOverride(root, pageOverrides.__global, true, pageOverrides.__brand?.branding);
  applyContentOverride(root, pageOverrides[path]);
}

export function PageOverrideRuntime() {
  const pathname = usePathname();
  const content = useStorefrontContent();
  const previousPath = useRef(pathname);
  useLayoutEffect(() => {
    const preview = new URLSearchParams(window.location.search).has("cmsPreview");
    if (!preview && !pathname.startsWith("/admin")) applyPageOverrides(content.pageOverrides, pathname);
    document.documentElement.removeAttribute("data-cms-pending");
    document.documentElement.dataset.cmsHydrated = "true";
    window.dispatchEvent(new Event("shea-cms-hydrated"));
    if (preview || pathname.startsWith("/admin")) return;
    const observer = new MutationObserver(() => applyPageOverrides(content.pageOverrides, pathname));
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "href"] });
    return () => observer.disconnect();
  }, [pathname, content.pageOverrides]);
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).has("cmsPreview");
    if (preview) {
      document.documentElement.dataset.cmsHydrated = "true";
      window.dispatchEvent(new Event("shea-cms-hydrated"));
      return;
    }
    let active = true;
    let request = 0;
    function refresh() {
      const id = ++request;
      void fetch("/api/storefront/content", { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("Content unavailable"); return response.json(); })
      .then((payload) => {
        if (!active || id !== request || !payload.data?.persisted) return;
        window.dispatchEvent(new CustomEvent("shea-storefront-content", { detail: payload.data }));
      })
      .catch(() => undefined);
    }
    const visible = () => { if (document.visibilityState === "visible") refresh(); };
    const storage = (event: StorageEvent) => { if (event.key === "sheaContentRevision") refresh(); };
    // The server supplied the saved snapshot. Fetch again only when notified
    // about an edit or when returning to the tab, never to replace defaults.
    if (previousPath.current !== pathname) refresh();
    previousPath.current = pathname;
    window.addEventListener("focus", refresh);
    window.addEventListener("shea-content-saved", refresh);
    window.addEventListener("storage", storage);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("shea-content-saved", refresh);
      window.removeEventListener("storage", storage);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [pathname]);
  return null;
}
