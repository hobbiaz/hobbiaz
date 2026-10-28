import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { listingUpdateSchema } from "@/lib/validators";

type P = { id: string };

export const GET = route<P>(async (_req, { params }) => {
  const { id } = await params;
  const l = await db.listing.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } }, category: true, owner: { select: { id: true, name: true, city: true } } } });
  const me = await getCurrentUser();
  const canSee = l && (l.status === "PUBLISHED" || (me && (me.id === l.ownerId || me.role === "ADMIN")));
  if (!l || !canSee) throw new HttpError(404, "Elan tapılmadı");
  return ok(l);
});

async function loadOwned(id: string) {
  const user = await requireUser();
  const l = await db.listing.findUnique({ where: { id } });
  if (!l) throw new HttpError(404, "Elan tapılmadı");
  if (l.ownerId !== user.id && user.role !== "ADMIN") throw new HttpError(403, "İcazə yoxdur");
  return { user, l };
}

export const PATCH = route<P>(async (req, { params }) => {
  const { id } = await params;
  const { user, l } = await loadOwned(id);
  const d = listingUpdateSchema.parse(await req.json());
  if (l.status === "REMOVED" && user.role !== "ADMIN") throw new HttpError(403, "Elan moderator tərəfindən silinib");
  let categoryId: string | undefined;
  if (d.categorySlug) {
    const c = await db.category.findUnique({ where: { slug: d.categorySlug } });
    if (!c) throw new HttpError(400, "Kateqoriya tapılmadı");
    categoryId = c.id;
  }
  if (d.images?.length) {
    const owned = await db.upload.count({ where: { key: { in: d.images }, ownerId: l.ownerId } });
    if (owned !== new Set(d.images).size) throw new HttpError(400, "Şəkillərdən biri sizə aid deyil");
  }
  const updated = await db.listing.update({
    where: { id },
    data: {
      title: d.title, description: d.description, condition: d.condition, city: d.city, status: d.status, categoryId,
      priceCents: d.priceAzn !== undefined ? Math.round(d.priceAzn * 100) : undefined,
      images: d.images ? { deleteMany: {}, create: d.images.map((storageKey, position) => ({ storageKey, position })) } : undefined,
    },
  });
  return ok(updated);
});

export const DELETE = route<P>(async (_req, { params }) => {
  const { id } = await params;
  await loadOwned(id);
  await db.listing.delete({ where: { id } });
  return ok({ ok: true });
});
