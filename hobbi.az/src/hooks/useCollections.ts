"use client";

import { useEffect, useState } from "react";
import { COLLECTION_CATEGORIES, SEARCH_COLLECTIONS } from "@/data/content";
import { PRODUCTS } from "@/data/products";
import { api } from "@/lib/api-client";
import { useUI } from "@/providers/UIProvider";
import type { CollectionDetail, CollectionSummary } from "@/types";

/** Demo mode (no database): the curated collections built from the built-in catalogue. */
export function demoCollection(id: string): CollectionDetail | null {
  const c = SEARCH_COLLECTIONS.find((x) => x.slug === id);
  if (!c) return null;
  const items = PRODUCTS.filter((p) => COLLECTION_CATEGORIES[c.slug].includes(p.cat));
  const images = items.map((p) => p.photo).filter(Boolean).slice(0, 4);
  return { id: c.slug, title: c.desktopTitle, curated: true, trending: c.trending, count: items.length, images, items };
}

/** Collections for the search panel; reloads every time `active` turns true (the panel opens). */
export function useCollections(active: boolean) {
  const { backend } = useUI();
  const [list, setList] = useState<CollectionSummary[] | null>(null);
  useEffect(() => {
    if (!active || backend === "checking") return;
    if (backend === "offline") {
      setList(SEARCH_COLLECTIONS.map((c) => demoCollection(c.slug)!).map(({ items: _items, ...rest }) => rest));
      return;
    }
    let cancelled = false;
    api<CollectionSummary[]>("/api/collections")
      .then((r) => { if (!cancelled) setList(r); })
      .catch(() => { if (!cancelled) setList((l) => l ?? []); });
    return () => { cancelled = true; };
  }, [active, backend]);
  return list;
}

/** The 3 most searched texts (empty in demo mode). */
export function usePopularSearches(active: boolean) {
  const { backend } = useUI();
  const [terms, setTerms] = useState<string[]>([]);
  useEffect(() => {
    if (!active || backend !== "online") return;
    api<string[]>("/api/search/popular").then(setTerms).catch(() => {});
  }, [active, backend]);
  return terms;
}
