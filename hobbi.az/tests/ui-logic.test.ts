import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import { applyFilters, EMPTY_FILTERS } from "@/lib/filters";
import { passwordStrength } from "@/lib/password";
import { shortDescription, toDetail } from "@/lib/product-detail";

describe("applyFilters", () => {
  it("returns every product when nothing is selected", () => {
    expect(applyFilters(PRODUCTS, EMPTY_FILTERS)).toHaveLength(PRODUCTS.length);
  });

  it("filters by category", () => {
    const list = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, categories: ["keramika"] });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((p) => p.cat === "keramika")).toBe(true);
  });

  it("combines price chips with OR and respects min/max", () => {
    const list = applyFilters(PRODUCTS, { ...EMPTY_FILTERS, priceChips: ["0-20", "50-100"], max: "60" });
    for (const p of list) {
      const price = Number(p.price);
      expect(price <= 20 || (price > 50 && price <= 60)).toBe(true);
    }
  });
});

describe("passwordStrength", () => {
  it("scores empty, weak and very strong passwords", () => {
    expect(passwordStrength("").label).toBe("");
    expect(passwordStrength("abcdefgh").label).toBe("Zəif");
    expect(passwordStrength("Abcdef1!").label).toBe("Çox güclü");
  });
});

describe("product detail model", () => {
  it("adds AZN prices and seller info", () => {
    const d = toDetail(PRODUCTS[0]);
    expect(d.price).toBe(`${PRODUCTS[0].price} AZN`);
    expect(d.creator.name).toBe(PRODUCTS[0].shop);
    expect(d.reviews).toHaveLength(2);
  });

  it("truncates long descriptions to 80 chars", () => {
    expect(shortDescription("a".repeat(100))).toBe("a".repeat(80) + "...");
    expect(shortDescription("qısa")).toBe("qısa");
  });
});
