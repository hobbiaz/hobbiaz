import { describe, expect, it } from "vitest";
import { r2Endpoint } from "@/lib/storage";

const base = { R2_ACCOUNT_ID: "abc123" } as unknown as NodeJS.ProcessEnv;

describe("R2 endpoint", () => {
  it("uses the default R2 address", () => {
    expect(r2Endpoint(base)).toBe("https://abc123.r2.cloudflarestorage.com");
  });
  it("supports buckets created with the EU jurisdiction", () => {
    expect(r2Endpoint({ ...base, R2_JURISDICTION: "EU" })).toBe("https://abc123.eu.r2.cloudflarestorage.com");
  });
  it("lets any S3-compatible endpoint override it (moving providers)", () => {
    expect(r2Endpoint({ ...base, R2_ENDPOINT: "https://s3.example.com/" })).toBe("https://s3.example.com");
  });
  it("rejects a malformed jurisdiction", () => {
    expect(() => r2Endpoint({ ...base, R2_JURISDICTION: "eu.evil.com/" })).toThrow();
  });
});
