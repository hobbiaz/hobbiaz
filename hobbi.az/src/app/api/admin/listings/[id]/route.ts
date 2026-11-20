import { db } from "@/lib/db";
import { route, ok, requireAdmin, HttpError } from "@/lib/http";
import { moderationSchema } from "@/lib/validators";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const d = moderationSchema.parse(await req.json());
  if (!(await db.listing.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, "Elan tapılmadı");
  const removing = d.action === "remove";
  const updated = await db.listing.update({
    where: { id },
    data: { status: removing ? "REMOVED" : "PUBLISHED", removedReason: removing ? d.reason ?? null : null, moderatedById: admin.id, moderatedAt: new Date() },
  });
  if (removing) await db.report.updateMany({ where: { listingId: id, status: "OPEN" }, data: { status: "RESOLVED" } });
  return ok(updated);
});
