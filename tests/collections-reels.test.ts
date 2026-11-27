import { describe, expect, it } from "vitest";
import { sniffVideo } from "@/lib/image-sniff";
import { KEY_RE, VIDEO_KEY_RE } from "@/lib/storage";
import { collectionSchema, reelCreateSchema, reelUploadSchema } from "@/lib/validators";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `listing${i}`);

describe("collectionSchema (Kolleksiya yarat)", () => {
  it("accepts 8–20 distinct listings with a name", () => {
    expect(collectionSchema.safeParse({ title: "Yay hədiyyələri", listingIds: ids(8) }).success).toBe(true);
    expect(collectionSchema.safeParse({ title: "Yay hədiyyələri", listingIds: ids(20) }).success).toBe(true);
  });
  it("rejects fewer than 8, more than 20, duplicates and a missing name", () => {
    expect(collectionSchema.safeParse({ title: "Ad", listingIds: ids(7) }).success).toBe(false);
    expect(collectionSchema.safeParse({ title: "Ad", listingIds: ids(21) }).success).toBe(false);
    expect(collectionSchema.safeParse({ title: "Ad", listingIds: [...ids(7), "listing0"] }).success).toBe(false);
    expect(collectionSchema.safeParse({ title: " ", listingIds: ids(10) }).success).toBe(false);
  });
});

describe("video uploads", () => {
  it("recognises MP4, MOV and WebM by their first bytes", () => {
    const mp4 = new Uint8Array([0, 0, 0, 0x20, ...[..."ftypisom"].map((c) => c.charCodeAt(0))]);
    const mov = new Uint8Array([0, 0, 0, 0x14, ...[..."ftypqt  "].map((c) => c.charCodeAt(0))]);
    const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x01]);
    expect(sniffVideo(mp4)?.ext).toBe("mp4");
    expect(sniffVideo(mov)?.ext).toBe("mov");
    expect(sniffVideo(webm)?.ext).toBe("webm");
    expect(sniffVideo(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBeNull(); // a JPEG is not a video
  });
  it("only allows video keys where videos are expected", () => {
    const key = "a".repeat(32);
    expect(VIDEO_KEY_RE.test(`${key}.mp4`)).toBe(true);
    expect(VIDEO_KEY_RE.test(`${key}.jpg`)).toBe(false);
    expect(KEY_RE.test(`${key}.webm`)).toBe(true);
    expect(KEY_RE.test(`../${key}.mp4`)).toBe(false);
  });
  it("validates the upload request and the reel", () => {
    expect(reelUploadSchema.safeParse({ mime: "video/mp4", size: 1000 }).success).toBe(true);
    expect(reelUploadSchema.safeParse({ mime: "video/avi", size: 1000 }).success).toBe(false);
    expect(reelUploadSchema.safeParse({ mime: "video/mp4", size: 101 * 1024 * 1024 }).success).toBe(false);
    expect(reelCreateSchema.safeParse({ key: `${"b".repeat(32)}.mp4`, title: "Gil vaza" }).success).toBe(true);
    expect(reelCreateSchema.safeParse({ key: `${"b".repeat(32)}.png`, title: "Gil vaza" }).success).toBe(false);
  });
});
