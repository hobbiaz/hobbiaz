import { describe, it, expect } from "vitest";
import { registerSchema, listingSchema, reportSchema } from "@/lib/validators";

describe("registerSchema", () => {
  it("accepts valid input and lowercases email", () => {
    const r = registerSchema.parse({ name: "Aysel", email: "Aysel@Example.com", password: "abc12345" });
    expect(r.email).toBe("aysel@example.com"); expect(r.role).toBe("BUYER");
  });
  it("rejects weak passwords", () => {
    expect(registerSchema.safeParse({ name: "Aysel", email: "a@b.az", password: "short1" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Aysel", email: "a@b.az", password: "onlyletters" }).success).toBe(false);
  });
  it("never allows self-registering as ADMIN", () => {
    expect(registerSchema.safeParse({ name: "X Y", email: "a@b.az", password: "abc12345", role: "ADMIN" }).success).toBe(false);
  });
});
describe("listingSchema", () => {
  const base = { title: "Güldan", description: "Əl işi saxsı güldan", priceAzn: "45.5", categorySlug: "el-isi", city: "Bakı" };
  it("coerces price and defaults to DRAFT", () => {
    const r = listingSchema.parse(base); expect(r.priceAzn).toBe(45.5); expect(r.status).toBe("DRAFT");
  });
  it("rejects negative price and bad image keys", () => {
    expect(listingSchema.safeParse({ ...base, priceAzn: -1 }).success).toBe(false);
    expect(listingSchema.safeParse({ ...base, images: ["../../etc/passwd"] }).success).toBe(false);
  });
});
describe("reportSchema", () => {
  it("rejects unknown reasons", () => expect(reportSchema.safeParse({ listingId: "x", reason: "LOL" }).success).toBe(false));
});
