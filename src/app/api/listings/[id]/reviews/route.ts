import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { route, ok, requireUser, HttpError, isUniqueViolation } from "@/lib/http";
import { reviewReplySchema, reviewSchema } from "@/lib/validators";
import { writeLimiter } from "@/lib/rate-limit";

type P = { id: string };

const toDto = (r: { id: string; rating: number; body: string; reply: string | null; createdAt: Date; userId: string; user: { name: string; avatarUrl: string | null } }, meId?: string) => ({
  id: r.id,
  rating: r.rating,
  text: r.body,
  user: r.user.name,
  avatar: r.user.avatarUrl ?? "",
  createdAt: r.createdAt.toISOString(),
  replies: r.reply ? [{ user: "Satıcı", text: r.reply }] : [],
  images: [] as string[],
  mine: r.userId === meId,
});

export const GET = route<P>(async (_req, { params }) => {
  const { id } = await params;
  const me = await getCurrentUser();
  const reviews = await db.review.findMany({
    where: { listingId: id, listing: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, avatarUrl: true } } },
  });
  return ok(reviews.map((r) => toDto(r, me?.id)));
});

/** One review per user per listing; sellers can't review their own listing. */
export const POST = route<P>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  if (!(await writeLimiter.hit(u.id))) throw new HttpError(429, "Çox sürətli. Bir az gözləyin");
  const l = await db.listing.findUnique({ where: { id }, select: { ownerId: true, status: true } });
  if (!l || l.status !== "PUBLISHED") throw new HttpError(404, "Elan tapılmadı");
  if (l.ownerId === u.id) throw new HttpError(400, "Öz məhsulunuza rəy yaza bilməzsiniz");
  const d = reviewSchema.parse(await req.json());
  try {
    const r = await db.review.create({ data: { listingId: id, userId: u.id, rating: d.rating, body: d.body }, include: { user: { select: { name: true, avatarUrl: true } } } });
    return ok(toDto(r, u.id), 201);
  } catch (e) {
    if (isUniqueViolation(e)) throw new HttpError(409, "Bu məhsula artıq rəy yazmısınız");
    throw e;
  }
});

/** The listing's owner answers a review: PATCH { reviewId, reply }. */
export const PATCH = route<P>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const body = (await req.json()) as { reviewId?: string };
  const d = reviewReplySchema.parse(body);
  const review = await db.review.findFirst({ where: { id: String(body.reviewId ?? ""), listingId: id }, include: { listing: { select: { ownerId: true } } } });
  if (!review) throw new HttpError(404, "Rəy tapılmadı");
  if (review.listing.ownerId !== u.id) throw new HttpError(403, "Yalnız satıcı cavab yaza bilər");
  const r = await db.review.update({ where: { id: review.id }, data: { reply: d.reply }, include: { user: { select: { name: true, avatarUrl: true } } } });
  return ok(toDto(r, u.id));
});
