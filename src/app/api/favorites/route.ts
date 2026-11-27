import { z } from "zod";
import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError, isUniqueViolation } from "@/lib/http";
import { listingInclude, toProduct } from "@/lib/listing-dto";

/** GET /api/favorites → my favourite products; ?ids=1 → just their ids. */
export const GET = route(async (req) => {
  const u = await requireUser();
  const where = { userId: u.id, listing: { status: "PUBLISHED" as const } };
  if (new URL(req.url).searchParams.get("ids") === "1") {
    const ids = await db.favorite.findMany({ where, select: { listingId: true } });
    return ok(ids.map((f) => f.listingId));
  }
  const favs = await db.favorite.findMany({ where, include: { listing: { include: listingInclude } }, orderBy: { createdAt: "desc" } });
  return ok(favs.map((f) => toProduct(f.listing)));
});

const body = z.object({ listingId: z.string().min(1), favorited: z.boolean().optional() });

/** Toggle, or set explicitly with { favorited: true|false } (used to merge guest favourites on login). */
export const POST = route(async (req) => {
  const u = await requireUser();
  const { listingId, favorited } = body.parse(await req.json());
  const listing = await db.listing.findFirst({ where: { id: listingId, status: "PUBLISHED" }, select: { id: true } });
  if (!listing) throw new HttpError(404, "Elan tapılmadı");
  const exists = await db.favorite.findUnique({ where: { userId_listingId: { userId: u.id, listingId } }, select: { listingId: true } });
  const want = favorited ?? !exists;
  if (!want) {
    await db.favorite.deleteMany({ where: { userId: u.id, listingId } });
    return ok({ favorited: false });
  }
  try {
    await db.favorite.create({ data: { userId: u.id, listingId } });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
  }
  return ok({ favorited: true });
});
