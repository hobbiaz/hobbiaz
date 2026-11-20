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
    const q = buildListingQuery({ q: "güldan", category: "el-isi", sort: "price_asc", page: "3" });
    expect(q.where.OR).toHaveLength(3); expect(q.where.category).toEqual({ slug: "el-isi" });
    expect(q.orderBy).toEqual({ priceCents: "asc" }); expect(q.skip).toBe(2 * PAGE_SIZE);
  });
  it("falls back to defaults on invalid params", () => {
    const q = buildListingQuery({ sort: "hack", page: "-5" });
    expect(q.filters.sort).toBe("new"); expect(q.filters.page).toBe(1);
  });
});
