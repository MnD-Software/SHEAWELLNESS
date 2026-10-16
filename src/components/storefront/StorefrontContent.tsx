"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { StoreContent } from "@/server/repositories/storeContentRepository";

const ContentContext = createContext<StoreContent | null>(null);

export function StorefrontContentProvider({ initialContent, children }: { initialContent: StoreContent; children: ReactNode }) {
  const [content, setContent] = useState(initialContent);
  useEffect(() => setContent(initialContent), [initialContent]);
  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<StoreContent>).detail;
      if (next?.persisted) setContent(next);
    };
    window.addEventListener("shea-storefront-content", update);
    return () => window.removeEventListener("shea-storefront-content", update);
  }, []);
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useStorefrontContent() {
  const content = useContext(ContentContext);
  if (!content) throw new Error("Storefront content provider is missing");
  return content;
}
