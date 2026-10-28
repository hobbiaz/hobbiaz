import { db } from "@/lib/db";
import { storage } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(key)) return new Response("Not found", { status: 404 });
  const meta = await db.upload.findUnique({ where: { key } });
  const data = meta && (await storage.get(key));
  if (!meta || !data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": meta.mime, "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
