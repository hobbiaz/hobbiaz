import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError, isUniqueViolation } from "@/lib/http";
import { reportSchema } from "@/lib/validators";

export const POST = route(async (req) => {
  const u = await requireUser();
  const d = reportSchema.parse(await req.json());
  const l = await db.listing.findUnique({ where: { id: d.listingId }, select: { id: true, ownerId: true, status: true } });
  if (!l || l.status !== "PUBLISHED") throw new HttpError(404, "Elan tapılmadı");
  if (l.ownerId === u.id) throw new HttpError(400, "Öz elanınız barədə şikayət edə bilməzsiniz");
  try {
    await db.report.create({ data: { listingId: l.id, reporterId: u.id, reason: d.reason, details: d.details } });
  } catch (e) {
    if (isUniqueViolation(e)) throw new HttpError(409, "Bu elan barədə artıq şikayət etmisiniz");
    throw e;
  }
  return ok({ ok: true }, 201);
});
