import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { orderUpdateSchema } from "@/lib/validators";

/**
 * PATCH /api/orders/:id { status }
 * Seller: PENDING → ACCEPTED | REJECTED, ACCEPTED → COMPLETED.  Buyer: PENDING → CANCELLED.
 */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const { status } = orderUpdateSchema.parse(await req.json());
  const o = await db.order.findUnique({ where: { id } });
  if (!o || (o.sellerId !== u.id && o.buyerId !== u.id)) throw new HttpError(404, "Sifariş tapılmadı");

  const isSeller = o.sellerId === u.id;
  const allowed =
    (isSeller && o.status === "PENDING" && (status === "ACCEPTED" || status === "REJECTED")) ||
    (isSeller && o.status === "ACCEPTED" && status === "COMPLETED") ||
    (!isSeller && o.status === "PENDING" && status === "CANCELLED");
  if (!allowed) throw new HttpError(409, "Bu status dəyişikliyi mümkün deyil");

  const updated = await db.order.update({ where: { id }, data: { status } });
  return ok({ id: updated.id, status: updated.status });
});
