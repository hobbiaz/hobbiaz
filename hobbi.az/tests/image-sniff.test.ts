import { describe, it, expect } from "vitest";
import { sniffImage } from "@/lib/image-sniff";

const bytes = (...n: number[]) => new Uint8Array(n);
describe("sniffImage", () => {
  it("detects jpeg/png/webp by magic bytes", () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe("jpg");
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe("png");
    expect(sniffImage(new TextEncoder().encode("RIFF\0\0\0\0WEBP"))?.ext).toBe("webp");
  });
  it("rejects scripts and html disguised as images", () => {
    expect(sniffImage(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(sniffImage(new TextEncoder().encode("GIF89a......"))).toBeNull();
  });
});
