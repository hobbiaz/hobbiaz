import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { listingUpdateSchema } from "@/lib/validators";
import { listingInclude, toProduct } from "@/lib/listing-dto";

type P = { id: string };

export const GET = route<P>(async (_req, { params }) => {
  const { id } = await params;
  const l = await db.listing.findUnique({ where: { id }, include: listingInclude });
  const me = await getCurrentUser();
  const canSee = l && (l.status === "PUBLISHED" || (me && (me.id === l.ownerId || me.role === "ADMIN")));
  if (!l || !canSee) throw new HttpError(404, "Elan tapılmadı");
  const rating = await db.review.aggregate({ where: { listingId: id }, _avg: { rating: true } });
  return ok({ ...toProduct(l), rating: rating._avg.rating ? Number(rating._avg.rating.toFixed(1)) : null });
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
  if (d.status === "PUBLISHED" && !d.images?.length && (await db.listingImage.count({ where: { listingId: id } })) === 0)
    throw new HttpError(400, "Dərc etmək üçün ən azı bir şəkil lazımdır");
  if (d.images?.length) {
    const owned = await db.upload.count({ where: { key: { in: d.images }, ownerId: l.ownerId } });
    if (owned !== d.images.length) throw new HttpError(400, "Şəkillərdən biri sizə aid deyil");
  }
  const updated = await db.listing.update({
    where: { id },
    data: {
      title: d.title, description: d.description, condition: d.condition, city: d.city, status: d.status, categoryId,
      phone: d.phone,
      priceCents: d.priceAzn !== undefined ? Math.round(d.priceAzn * 100) : undefined,
      oldPriceCents: d.oldPriceAzn === undefined ? undefined : d.oldPriceAzn ? Math.round(d.oldPriceAzn * 100) : null,
      images: d.images ? { deleteMany: {}, create: d.images.map((storageKey, position) => ({ storageKey, position })) } : undefined,
    },
    include: listingInclude,
  });
  return ok(toProduct(updated));
});

export const DELETE = route<P>(async (_req, { params }) => {
  const { id } = await params;
  await loadOwned(id);
  await db.listing.delete({ where: { id } });
  return ok({ ok: true });
});
