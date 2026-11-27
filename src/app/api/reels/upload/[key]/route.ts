import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { getStorage, LocalStorage, VIDEO_KEY_RE } from "@/lib/storage";
import { MAX_VIDEO_BYTES } from "@/lib/image-sniff";

/** PUT /api/reels/upload/<key> — local development only (production uploads go to R2). */
export const PUT = route<{ key: string }>(async (req, { params }) => {
  const user = await requireUser();
  const { key } = await params;
  const storage = getStorage();
  if (!(storage instanceof LocalStorage)) throw new HttpError(404, "Tapılmadı");
  if (!VIDEO_KEY_RE.test(key)) throw new HttpError(400, "Yanlış fayl");
  const slot = await db.upload.findUnique({ where: { key } });
  if (!slot || slot.ownerId !== user.id || slot.size !== 0) throw new HttpError(403, "Bu yükləmə sizə aid deyil");
  if (!req.body) throw new HttpError(400, "Fayl göndərilməyib");
  try {
    const size = await storage.putStream(key, req.body, MAX_VIDEO_BYTES);
    return ok({ size });
  } catch {
    throw new HttpError(413, "Video 100 MB-dan böyükdür");
  }
});
