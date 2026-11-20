import { describe, expect, it } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";
import { isAzPhone, isEmail, passwordProblem } from "@/lib/password";
import { searchProducts } from "@/lib/filters";
import { isCategorySlug } from "@/types";
import { PRODUCTS } from "@/data/products";
import { listingSchema } from "@/lib/validators";

describe("RateLimiter", () => {
  it("allows up to the limit, then blocks until the window resets", () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.hit("a", 0)).toBe(true);
    expect(rl.hit("a", 10)).toBe(true);
    expect(rl.hit("a", 20)).toBe(false);
    expect(rl.hit("b", 20)).toBe(true); // keys are independent
    expect(rl.hit("a", 1001)).toBe(true); // new window
  });
  it("reset clears a key", () => {
    const rl = new RateLimiter(1, 1000);
    rl.hit("a", 0);
    expect(rl.hit("a", 1)).toBe(false);
    rl.reset("a");
    expect(rl.hit("a", 2)).toBe(true);
  });
});

describe("signup validation (matches server rules)", () => {
  it("passwordProblem", () => {
    expect(passwordProblem("short1")).toMatch(/8 simvol/);
    expect(passwordProblem("onlyletters")).toMatch(/rəqəm/);
    expect(passwordProblem("12345678")).toMatch(/hərf/);
    expect(passwordProblem("hobbi2026")).toBeNull();
  });
  it("isAzPhone accepts local mobile formats", () => {
    expect(isAzPhone("50 123 45 67")).toBe(true);
    expect(isAzPhone("0501234567")).toBe(true);
    expect(isAzPhone("123")).toBe(false);
    expect(isAzPhone("40 123 45 67")).toBe(false);
  });
  it("isEmail", () => {
    expect(isEmail("a@b.az")).toBe(true);
    expect(isEmail("a@b")).toBe(false);
  });
});

describe("searchProducts", () => {
  it("returns everything for an empty query", () => {
    expect(searchProducts(PRODUCTS, "  ")).toHaveLength(PRODUCTS.length);
  });
  it("matches case-insensitively, every word required", () => {
    const first = PRODUCTS[0];
    const word = first.title.split(" ")[0];
    const hits = searchProducts(PRODUCTS, word.toLocaleUpperCase("az"));
    expect(hits.map((p) => p.id)).toContain(first.id);
    expect(searchProducts(PRODUCTS, `${word} zzzznotaword`)).toHaveLength(0);
  });
});

describe("misc", () => {
  it("isCategorySlug", () => {
    expect(isCategorySlug("resm")).toBe(true);
    expect(isCategorySlug("hack")).toBe(false);
    expect(isCategorySlug(null)).toBe(false);
  });
  it("listing images are de-duplicated", () => {
    const key = "a".repeat(32) + ".jpg";
    const d = listingSchema.parse({ title: "Saxsı", description: "Əl işi saxsı güldan", priceAzn: 10, categorySlug: "keramika", city: "Bakı", images: [key, key] });
    expect(d.images).toEqual([key]);
  });
});
