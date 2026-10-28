import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { listingSchema } from "@/lib/validators";
import { buildListingQuery } from "@/lib/listing-query";

export const GET = route(async (req) => {
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const { where, orderBy, skip, take, filters } = buildListingQuery(sp);
  const [items, total] = await Promise.all([
    db.listing.findMany({ where, orderBy, skip, take, include: { images: { orderBy: { position: "asc" }, take: 1 }, category: true, owner: { select: { id: true, name: true } } } }),
    db.listing.count({ where }),
  ]);
  return ok({ items, total, page: filters.page });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  if (user.role === "BUYER") throw new HttpError(403, "Elan yerləşdirmək üçün satıcı hesabı lazımdır");
  const d = listingSchema.parse(await req.json());
  const category = await db.category.findUnique({ where: { slug: d.categorySlug } });
  if (!category) throw new HttpError(400, "Kateqoriya tapılmadı");
  if (d.images.length) {
    const owned = await db.upload.count({ where: { key: { in: d.images }, ownerId: user.id } });
    if (owned !== new Set(d.images).size) throw new HttpError(400, "Şəkillərdən biri sizə aid deyil");
  }
  const listing = await db.listing.create({
    data: {
      ownerId: user.id, categoryId: category.id, title: d.title, description: d.description,
      priceCents: Math.round(d.priceAzn * 100), condition: d.condition, city: d.city, status: d.status,
      images: { create: d.images.map((storageKey, position) => ({ storageKey, position })) },
    },
  });
  return ok(listing, 201);
});
