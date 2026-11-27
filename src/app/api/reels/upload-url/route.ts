import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { getStorage, R2Storage } from "@/lib/storage";
import { VIDEO_MIMES } from "@/lib/image-sniff";
import { reelUploadSchema } from "@/lib/validators";
import { uploadLimiter } from "@/lib/rate-limit";

/**
 * POST /api/reels/upload-url { mime, size } → { key, url, headers }
 * The browser then PUTs the file to `url`: straight to R2 in production (pre-signed, 15 min),
 * or to /api/reels/upload/<key> on a local machine.
 */
export const POST = route(async (req) => {
  const user = await requireUser();
  if (user.role === "BUYER") throw new HttpError(403, "Video paylaşmaq üçün mağaza açın");
  if (!(await uploadLimiter.hit(user.id))) throw new HttpError(429, "Saatlıq yükləmə limiti dolub");
  const d = reelUploadSchema.parse(await req.json());
  const type = VIDEO_MIMES[d.mime]!;
  const key = `${randomBytes(16).toString("hex")}.${type.ext}`;
  // size 0 = reserved, not uploaded yet; POST /api/reels fills it in after checking the file.
  await db.upload.create({ data: { key, ownerId: user.id, mime: type.mime, size: 0 } });
  const storage = getStorage();
  const url = storage instanceof R2Storage
    ? await storage.presign(key, "PUT", 15 * 60, type.mime)
    : `/api/reels/upload/${key}`;
  return ok({ key, url, headers: { "Content-Type": type.mime } }, 201);
});
