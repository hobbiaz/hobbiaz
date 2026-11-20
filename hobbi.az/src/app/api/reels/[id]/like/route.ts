import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError, isUniqueViolation } from "@/lib/http";

export const POST = route<{ id: string }>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  if (!(await db.reel.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, "Video tapılmadı");
  // deleteMany/create instead of find-then-write, so two quick taps never 500.
  const removed = await db.reelLike.deleteMany({ where: { userId: u.id, reelId: id } });
  if (removed.count) return ok({ liked: false });
  try {
    await db.reelLike.create({ data: { userId: u.id, reelId: id } });
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
  }
  return ok({ liked: true });
});
