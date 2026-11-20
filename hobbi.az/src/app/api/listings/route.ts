import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { listingSchema } from "@/lib/validators";
import { buildListingQuery, PAGE_SIZE } from "@/lib/listing-query";
import { listingInclude, toProduct } from "@/lib/listing-dto";
import { writeLimiter } from "@/lib/rate-limit";

/**
 * GET /api/listings?q=&category=&min=&max=&sort=&page=&discount=1&ids=a,b
 * GET /api/listings?owner=me — the signed-in seller's own listings (every status)
 * GET /api/listings?owner=<store-slug> — one store's published listings
 */
export const GET = route(async (req) => {
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const { where, orderBy, skip, take, filters } = buildListingQuery(sp);
  if (filters.owner === "me") {
    const me = await requireUser();
    delete where.status;
    where.ownerId = me.id;
    where.status = { not: "REMOVED" };
  } else if (filters.owner) {
    where.owner = { store: { slug: filters.owner } };
  }
  const [items, total] = await Promise.all([
    db.listing.findMany({ where, orderBy, skip, take, include: listingInclude }),
    db.listing.count({ where }),
  ]);
  return ok({ items: items.map(toProduct), total, page: filters.page, pageSize: PAGE_SIZE, hasMore: skip + items.length < total });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  if (user.role === "BUYER") throw new HttpError(403, "Elan yerləşdirmək üçün mağaza açın");
  if (!(await writeLimiter.hit(user.id))) throw new HttpError(429, "Çox sürətli. Bir az gözləyin");
  const d = listingSchema.parse(await req.json());
  const category = await db.category.findUnique({ where: { slug: d.categorySlug } });
  if (!category) throw new HttpError(400, "Kateqoriya tapılmadı");
  if (d.images.length) {
    const owned = await db.upload.count({ where: { key: { in: d.images }, ownerId: user.id } });
    if (owned !== d.images.length) throw new HttpError(400, "Şəkillərdən biri sizə aid deyil");
  }
  if (d.status === "PUBLISHED" && !d.images.length) throw new HttpError(400, "Dərc etmək üçün ən azı bir şəkil əlavə edin");
  const listing = await db.listing.create({
    data: {
      ownerId: user.id, categoryId: category.id, title: d.title, description: d.description,
      priceCents: Math.round(d.priceAzn * 100),
      oldPriceCents: d.oldPriceAzn ? Math.round(d.oldPriceAzn * 100) : null,
      phone: d.phone ?? null,
      condition: d.condition, city: d.city, status: d.status,
      images: { create: d.images.map((storageKey, position) => ({ storageKey, position })) },
    },
    include: listingInclude,
  });
  return ok(toProduct(listing), 201);
});
