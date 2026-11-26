export type ImageType = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" };
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Detects image type from magic bytes. Client-provided MIME/extension is never trusted. */
export function sniffImage(b: Uint8Array): ImageType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return { mime: "image/png", ext: "png" };
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}

export type VideoType = { mime: "video/mp4" | "video/webm" | "video/quicktime"; ext: "mp4" | "webm" | "mov" };
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const VIDEO_MIMES: Record<string, VideoType> = {
  "video/mp4": { mime: "video/mp4", ext: "mp4" },
  "video/webm": { mime: "video/webm", ext: "webm" },
  "video/quicktime": { mime: "video/quicktime", ext: "mov" },
};

/** Detects MP4/MOV (ISO-BMFF "ftyp" box) and WebM (EBML header) from the first bytes. */
export function sniffVideo(b: Uint8Array): VideoType | null {
  if (b.length >= 12 && String.fromCharCode(...b.slice(4, 8)) === "ftyp") {
    const brand = String.fromCharCode(...b.slice(8, 12));
    return brand === "qt  " ? VIDEO_MIMES["video/quicktime"]! : VIDEO_MIMES["video/mp4"]!;
  }
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return VIDEO_MIMES["video/webm"]!;
  return null;
}
