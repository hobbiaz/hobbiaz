import { describe, it, expect } from "vitest";
import { registerSchema, listingSchema, reportSchema } from "@/lib/validators";

describe("registerSchema", () => {
  const token = "x".repeat(20);
  it("accepts valid input and lowercases email", () => {
    const r = registerSchema.parse({ email: "Aysel@Example.com", password: "abc12345", verificationToken: token });
    expect(r.email).toBe("aysel@example.com");
  });
  it("rejects weak passwords", () => {
    expect(registerSchema.safeParse({ email: "a@b.az", password: "short1", verificationToken: token }).success).toBe(false);
    expect(registerSchema.safeParse({ email: "a@b.az", password: "onlyletters", verificationToken: token }).success).toBe(false);
  });
  it("requires an e-mail verification token", () => {
    expect(registerSchema.safeParse({ email: "a@b.az", password: "abc12345" }).success).toBe(false);
  });
  it("never lets the client choose a role", () => {
    const r = registerSchema.parse({ email: "a@b.az", password: "abc12345", verificationToken: token, role: "ADMIN" });
    expect("role" in r).toBe(false);
  });
});
describe("listingSchema", () => {
  const base = { title: "Güldan", description: "Əl işi saxsı güldan", priceAzn: "45.5", categorySlug: "keramika", city: "Bakı" };
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
