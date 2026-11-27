import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";
import { toProduct, type ListingWithRelations } from "@/lib/listing-dto";
import { timeAgo } from "@/lib/api-client";
import { orderSchema, storeCreateSchema, storeUpdateSchema, otpVerifySchema, loginSchema } from "@/lib/validators";

describe("slugify", () => {
  it("keeps Azerbaijani letters readable", () => {
    expect(slugify("Aysel Keramika")).toBe("aysel-keramika");
    expect(slugify("ZərgərStudio")).toBe("zergerstudio");
    expect(slugify("Şəki Xalçaçılıq Ğ Ü Ö İ")).toBe("seki-xalcaciliq-g-u-o-i");
    expect(slugify("  ***  ")).toBe("magaza");
  });
});

describe("toProduct", () => {
  const base = {
    id: "ck1", title: "Güldan", description: "Saxsı güldan", priceCents: 4550, oldPriceCents: 6000, phone: null,
    city: "Gəncə", status: "PUBLISHED", isDemo: false, ownerId: "u1", createdAt: new Date(Date.now() - 10 * 86_400_000),
    category: { id: "c1", slug: "keramika", name: "Keramika" },
    images: [{ id: "i1", listingId: "ck1", storageKey: "a".repeat(32) + ".jpg", url: null, position: 0 }, { id: "i2", listingId: "ck1", storageKey: null, url: "https://x/y.jpg", position: 1 }],
    owner: { id: "u1", name: "Aysel", phone: "+99450", avatarUrl: null, store: { name: "AyselKeramika", slug: "aysel", avatarUrl: null, region: "Gəncə", phone: "+99455", instagram: null, tiktok: null } },
    _count: { favorites: 3, reviews: 1 },
  } as unknown as ListingWithRelations;

  it("maps prices, images, store and counters", () => {
    const p = toProduct(base);
    expect(p.price).toBe("45.50");
    expect(p.oldPrice).toBe("60");
    expect(p.images).toEqual([`/api/media/${"a".repeat(32)}.jpg`, "https://x/y.jpg"]);
    expect(p.shop).toBe("AyselKeramika");
    expect(p.phone).toBe("+99455");
    expect(p.badge).toBeNull();
    expect(p.favoriteCount).toBe(3);
    expect(p.cat).toBe("keramika");
  });
  it("drops an old price that is not higher and marks new listings", () => {
    const p = toProduct({ ...base, oldPriceCents: 100, createdAt: new Date() } as ListingWithRelations);
    expect(p.oldPrice).toBeUndefined();
    expect(p.badge).toBe("YENİ");
  });
});

describe("timeAgo", () => {
  it("formats in Azerbaijani", () => {
    expect(timeAgo(new Date(Date.now() - 2 * 3_600_000).toISOString())).toBe("2 saat əvvəl");
    expect(timeAgo(new Date(Date.now() - 3 * 86_400_000).toISOString())).toBe("3 gün əvvəl");
  });
});

describe("new schemas", () => {
  it("store names need 4+ chars and a known category", () => {
    expect(storeCreateSchema.safeParse({ name: "abc", categorySlug: "keramika" }).success).toBe(false);
    expect(storeCreateSchema.safeParse({ name: "Aysel", categorySlug: "hack" }).success).toBe(false);
    expect(storeCreateSchema.parse({ name: "Aysel", categorySlug: "resm" }).region).toBe("Bakı");
  });
  it("store links must be URLs; empty string clears", () => {
    expect(storeUpdateSchema.safeParse({ instagram: "not a url" }).success).toBe(false);
    expect(storeUpdateSchema.parse({ instagram: "" }).instagram).toBeNull();
  });
  it("OTP code is exactly 6 digits", () => {
    expect(otpVerifySchema.safeParse({ email: "a@b.az", purpose: "SIGNUP", code: "12345" }).success).toBe(false);
    expect(otpVerifySchema.safeParse({ email: "a@b.az", purpose: "SIGNUP", code: "123456" }).success).toBe(true);
  });
  it("orders limit quantity", () => {
    expect(orderSchema.safeParse({ listingId: "x", quantity: 0 }).success).toBe(false);
    expect(orderSchema.parse({ listingId: "x" }).quantity).toBe(1);
  });
  it("login accepts identity or legacy email field", () => {
    expect(loginSchema.safeParse({ identity: "ZərgərStudio", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.az", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ password: "x" }).success).toBe(false);
  });
});
