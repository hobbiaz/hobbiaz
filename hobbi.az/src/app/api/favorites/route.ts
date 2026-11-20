import { z } from "zod";
import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError, isUniqueViolation } from "@/lib/http";

export const GET = route(async () => {
  const u = await requireUser();
  const favs = await db.favorite.findMany({ where: { userId: u.id, listing: { status: "PUBLISHED" } }, include: { listing: { include: { images: { take: 1, orderBy: { position: "asc" } } } } }, orderBy: { createdAt: "desc" } });
  return ok(favs.map((f) => f.listing));
});

/** Toggle: adds if absent, removes if present. */
export const POST = route(async (req) => {
  const u = await requireUser();
  const { listingId } = z.object({ listingId: z.string().min(1) }).parse(await req.json());
  const listing = await db.listing.findFirst({ where: { id: listingId, status: "PUBLISHED" }, select: { id: true } });
  if (!listing) throw new HttpError(404, "Elan tapılmadı");
  // deleteMany/create instead of find-then-write, so two quick taps never 500.
  const removed = await db.favorite.deleteMany({ where: { userId: u.id, listingId } });
  if (removed.count) return ok({ favorited: false });
  try {
    await db.favorite.create({ data: { userId: u.id, listingId } });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
  }
  return ok({ favorited: true });
});
