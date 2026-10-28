import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { sniffImage, MAX_IMAGE_BYTES } from "@/lib/image-sniff";
import { route, ok, requireUser, HttpError } from "@/lib/http";

export const POST = route(async (req) => {
  const user = await requireUser();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Fayl seçilməyib");
  if (file.size > MAX_IMAGE_BYTES) throw new HttpError(413, "Fayl 5 MB-dan böyükdür");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(buf);
  if (!type) throw new HttpError(415, "Yalnız JPG, PNG və WebP şəkilləri qəbul edilir");
  const key = `${randomBytes(16).toString("hex")}.${type.ext}`;
  await storage.put(key, buf);
  await db.upload.create({ data: { key, ownerId: user.id, mime: type.mime, size: buf.length } });
  return ok({ key, url: `/api/media/${key}` }, 201);
});
