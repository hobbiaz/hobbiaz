import { db } from "@/lib/db";
import { getStorage, KEY_RE, LocalStorage, R2Storage, VIDEO_KEY_RE } from "@/lib/storage";

const NOT_FOUND = () => new Response("Not found", { status: 404 });

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!KEY_RE.test(key)) return NOT_FOUND();
  const meta = await db.upload.findUnique({ where: { key } });
  if (!meta || (VIDEO_KEY_RE.test(key) && meta.size === 0)) return NOT_FOUND();
  const storage = getStorage();

  if (VIDEO_KEY_RE.test(key)) {
    // R2: hand the player a short-lived signed link (supports Range/seeking natively).
    if (storage instanceof R2Storage) {
      return Response.redirect(await storage.presign(key, "GET", 60 * 60), 302);
    }
    if (storage instanceof LocalStorage) return streamLocalVideo(req, storage, key, meta.mime);
  }

  const data = await storage.get(key);
  if (!data) return NOT_FOUND();
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": meta.mime, "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}

/** Byte-range responses so <video> can seek (and Safari plays at all). */
async function streamLocalVideo(req: Request, storage: LocalStorage, key: string, mime: string) {
  const size = await storage.size(key);
  if (!size) return NOT_FOUND();
  const headers: Record<string, string> = {
    "Content-Type": mime, "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable",
  };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (!m) return new Response(storage.stream(key, 0, size - 1), { headers: { ...headers, "Content-Length": String(size) } });
  let start = m[1] ? Number(m[1]) : size - Number(m[2]);
  let end = m[1] && m[2] ? Number(m[2]) : size - 1;
  start = Math.max(0, start);
  end = Math.min(end, size - 1);
  if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  return new Response(storage.stream(key, start, end), {
    status: 206,
    headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
  });
}
