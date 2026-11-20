import { z } from "zod";
import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";

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
  const key = { userId_listingId: { userId: u.id, listingId } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) { await db.favorite.delete({ where: key }); return ok({ favorited: false }); }
  await db.favorite.create({ data: { userId: u.id, listingId } });
  return ok({ favorited: true });
});
