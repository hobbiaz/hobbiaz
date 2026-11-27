import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError, isUniqueViolation } from "@/lib/http";
import { storeCreateSchema, storeUpdateSchema } from "@/lib/validators";
import { slugify } from "@/lib/slug";

/** POST /api/store — an existing (buyer) account opens a store and becomes a seller. */
export const POST = route(async (req) => {
  const u = await requireUser();
  if (await db.store.findUnique({ where: { ownerId: u.id }, select: { id: true } })) throw new HttpError(409, "Sizin artıq mağazanız var");
  const d = storeCreateSchema.parse(await req.json());
  const base = slugify(d.name);
  let slug = base;
  for (let i = 2; await db.store.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
  try {
    const store = await db.store.create({ data: { ownerId: u.id, name: d.name, slug, categorySlug: d.categorySlug, region: d.region, phone: d.phone } });
    if (u.role === "BUYER") await db.user.update({ where: { id: u.id }, data: { role: "SELLER" } });
    return ok(store, 201);
  } catch (e) {
    if (isUniqueViolation(e)) throw new HttpError(409, "Bu marka adı artıq tutulub");
    throw e;
  }
});

/** PATCH /api/store — the signed-in seller updates their own store. */
export const PATCH = route(async (req) => {
  const u = await requireUser();
  const store = await db.store.findUnique({ where: { ownerId: u.id }, select: { id: true } });
  if (!store) throw new HttpError(404, "Mağazanız yoxdur");
  const d = storeUpdateSchema.parse(await req.json());
  let avatarUrl: string | undefined;
  if (d.avatarKey) {
    const upload = await db.upload.findFirst({ where: { key: d.avatarKey, ownerId: u.id }, select: { key: true } });
    if (!upload) throw new HttpError(400, "Şəkil sizə aid deyil");
    avatarUrl = `/api/media/${upload.key}`;
  }
  const updated = await db.store.update({
    where: { id: store.id },
    data: { region: d.region, bio: d.bio, phone: d.phone, instagram: d.instagram, tiktok: d.tiktok, avatarUrl },
  });
  if (avatarUrl) await db.user.update({ where: { id: u.id }, data: { avatarUrl } });
  if (d.region) await db.user.update({ where: { id: u.id }, data: { city: d.region } });
  return ok(updated);
});
