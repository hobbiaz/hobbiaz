import type { CategorySlug, Product } from "@/types";

export type PriceChip = "0-20" | "20-50" | "50-100" | "discount";
export type Feature = "handmade" | "personal" | "custom_order" | "gift";

export interface FilterState {
  categories: CategorySlug[];
  priceChips: PriceChip[];
  features: Feature[];
  min: string;
  max: string;
}

export const DEFAULT_FILTERS: FilterState = {
  categories: ["zergerllik"],
  priceChips: ["20-50"],
  features: ["handmade"],
  min: "0",
  max: "500",
};

export const EMPTY_FILTERS: FilterState = { categories: [], priceChips: [], features: [], min: "0", max: "500" };

function matchesChip(p: Product, chip: PriceChip) {
  const price = parseFloat(p.price) || 0;
  switch (chip) {
    case "0-20": return price <= 20;
    case "20-50": return price > 20 && price <= 50;
    case "50-100": return price > 50 && price <= 100;
    case "discount": return Boolean(p.oldPrice);
  }
}

/**
 * Applies the filter panel to the catalogue. Features are UI-only for now (the demo
 * data has no such attributes), so they never exclude products.
 */
export function applyFilters(products: Product[], f: FilterState): Product[] {
  const min = parseFloat(f.min) || 0;
  const max = parseFloat(f.max) || Infinity;
  return products.filter((p) => {
    const price = parseFloat(p.price) || 0;
    if (f.categories.length && !f.categories.includes(p.cat)) return false;
    if (f.priceChips.length && !f.priceChips.some((c) => matchesChip(p, c))) return false;
    return price >= min && price <= max;
  });
}

export const activeFilterCount = (f: FilterState) => f.categories.length + f.priceChips.length + f.features.length;

const norm = (s: string) => s.toLocaleLowerCase("az").normalize("NFC");

/** Free-text search over the demo catalogue: every word must appear in title/shop/description/category. */
export function searchProducts(products: Product[], query: string): Product[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return products;
  return products.filter((p) => {
    const hay = norm([p.title, p.shop ?? "", p.desc ?? "", p.cat].join(" "));
    return words.every((w) => hay.includes(w));
  });
}
