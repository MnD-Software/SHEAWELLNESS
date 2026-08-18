"use client";

import { useEffect } from "react";
import type { PageOverrides } from "@/server/repositories/storeContentRepository";

export const editableTextSelector = "main h1, main h2, main h3, main h4, main p, main li, main blockquote, main figcaption";
export const editableImageSelector = "main img";

export function applyPageOverrides(pageOverrides: PageOverrides, path = window.location.pathname, root: ParentNode = document) {
  const page = pageOverrides[path];
  if (!page) return;
  const textNodes = Array.from(root.querySelectorAll<HTMLElement>(editableTextSelector));
  const imageNodes = Array.from(root.querySelectorAll<HTMLImageElement>(editableImageSelector));
  Object.entries(page.texts ?? {}).forEach(([key, value]) => {
    const node = textNodes[Number(key)];
    if (node && node.textContent !== value) node.textContent = value;
  });
  Object.entries(page.images ?? {}).forEach(([key, value]) => {
    const node = imageNodes[Number(key)];
    if (node && node.getAttribute("src") !== value) node.src = value;
  });
}

export function PageOverrideRuntime() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin") || new URLSearchParams(window.location.search).has("cmsPreview")) return;
    let active = true;
    let observer: MutationObserver | null = null;
    void fetch("/api/storefront/content", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        const pageOverrides = (payload.data?.pageOverrides ?? {}) as PageOverrides;
        applyPageOverrides(pageOverrides);
        observer = new MutationObserver(() => applyPageOverrides(pageOverrides));
        const main = document.querySelector("main");
        if (main) observer.observe(main, { childList: true, subtree: true });
      })
      .catch(() => undefined);
    return () => {
      active = false;
      observer?.disconnect();
    };
  }, []);
  return null;
}
