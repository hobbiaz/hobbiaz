import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { collectionSchema } from "@/lib/validators";
import { listCollections } from "@/lib/collections";
import { writeLimiter } from "@/lib/rate-limit";

/** GET /api/collections — curated collections, then the newest user collections. */
export const GET = route(async () => ok(await listCollections()));

/** POST /api/collections { title, listingIds } — publish a collection (8–20 listings). */
export const POST = route(async (req) => {
  const user = await requireUser();
  if (!(await writeLimiter.hit(user.id))) throw new HttpError(429, "Çox sürətli. Bir az gözləyin");
  const d = collectionSchema.parse(await req.json());
  const found = await db.listing.count({ where: { id: { in: d.listingIds }, status: "PUBLISHED" } });
  if (found !== d.listingIds.length) throw new HttpError(400, "Seçilmiş məhsullardan biri artıq mövcud deyil");
  const c = await db.collection.create({
    data: {
      ownerId: user.id,
      title: d.title,
      items: { create: d.listingIds.map((listingId, position) => ({ listingId, position })) },
    },
  });
  return ok({ id: c.id }, 201);
});
