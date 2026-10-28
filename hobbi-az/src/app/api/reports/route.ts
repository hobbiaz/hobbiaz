import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { reportSchema } from "@/lib/validators";

export const POST = route(async (req) => {
  const u = await requireUser();
  const d = reportSchema.parse(await req.json());
  const l = await db.listing.findUnique({ where: { id: d.listingId }, select: { id: true, ownerId: true } });
  if (!l) throw new HttpError(404, "Elan tapılmadı");
  if (l.ownerId === u.id) throw new HttpError(400, "Öz elanınız barədə şikayət edə bilməzsiniz");
  const exists = await db.report.findUnique({ where: { listingId_reporterId: { listingId: l.id, reporterId: u.id } } });
  if (exists) throw new HttpError(409, "Bu elan barədə artıq şikayət etmisiniz");
  await db.report.create({ data: { listingId: l.id, reporterId: u.id, reason: d.reason, details: d.details } });
  return ok({ ok: true }, 201);
});
