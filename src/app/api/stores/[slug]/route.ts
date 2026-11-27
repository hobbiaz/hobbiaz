import { db } from "@/lib/db";
import { route, ok, HttpError } from "@/lib/http";
import { listingInclude, toProduct } from "@/lib/listing-dto";

/** Public store profile with its published listings. */
export const GET = route<{ slug: string }>(async (_req, { params }) => {
  const { slug } = await params;
  const store = await db.store.findUnique({ where: { slug } });
  if (!store) throw new HttpError(404, "Mağaza tapılmadı");
  const [listings, rating] = await Promise.all([
    db.listing.findMany({ where: { ownerId: store.ownerId, status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 48, include: listingInclude }),
    db.review.aggregate({ where: { listing: { ownerId: store.ownerId } }, _avg: { rating: true }, _count: true }),
  ]);
  return ok({
    name: store.name,
    slug: store.slug,
    region: store.region,
    avatarUrl: store.avatarUrl,
    bio: store.bio,
    instagram: store.instagram,
    tiktok: store.tiktok,
    since: store.createdAt.toISOString(),
    rating: rating._avg.rating ? Number(rating._avg.rating.toFixed(1)) : null,
    reviewCount: rating._count,
    listings: listings.map(toProduct),
  });
});
