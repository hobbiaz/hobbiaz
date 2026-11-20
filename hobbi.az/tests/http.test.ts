import { describe, it, expect } from "vitest";
import { sameOrigin } from "@/lib/http";

describe("sameOrigin", () => {
  it("accepts matching host and configured origin", () => {
    expect(sameOrigin("http://localhost:3000", "localhost:3000")).toBe(true);
    expect(sameOrigin("https://hobbi.az", "x", "https://hobbi.az")).toBe(true);
  });
  it("rejects missing or foreign origins", () => {
    expect(sameOrigin(null, "localhost:3000")).toBe(false);
    expect(sameOrigin("https://evil.com", "localhost:3000")).toBe(false);
  });
});
