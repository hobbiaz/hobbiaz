import { describe, it, expect } from "vitest";
import { buildListingQuery, PAGE_SIZE } from "@/lib/listing-query";

describe("buildListingQuery", () => {
  it("defaults: published only, newest first, page 1", () => {
    const q = buildListingQuery({});
    expect(q.where).toEqual({ status: "PUBLISHED" }); expect(q.orderBy).toEqual({ createdAt: "desc" }); expect(q.skip).toBe(0);
  });
  it("converts AZN price range to qəpik", () => {
    expect(buildListingQuery({ min: "10", max: "20.5" }).where.priceCents).toEqual({ gte: 1000, lte: 2050 });
  });
  it("applies search, category, sort and pagination", () => {
    const q = buildListingQuery({ q: "saxsı güldan", category: "keramika", sort: "price_asc", page: "3" });
    expect(q.where.AND).toHaveLength(2); expect(q.where.category).toEqual({ slug: "keramika" });
    expect(q.orderBy).toEqual({ priceCents: "asc" }); expect(q.skip).toBe(2 * PAGE_SIZE);
  });
  it("ignores the 'all' category and filters discounts", () => {
    const q = buildListingQuery({ category: "all", discount: "1" });
    expect(q.where.category).toBeUndefined(); expect(q.where.oldPriceCents).toEqual({ not: null });
  });
  it("falls back to defaults on invalid params", () => {
    const q = buildListingQuery({ sort: "hack", page: "-5" });
    expect(q.filters.sort).toBe("new"); expect(q.filters.page).toBe(1);
  });
});
