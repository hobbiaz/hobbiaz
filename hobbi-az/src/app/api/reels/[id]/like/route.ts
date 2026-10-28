import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";

export const POST = route<{ id: string }>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  if (!(await db.reel.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, "Video tapılmadı");
  const key = { userId_reelId: { userId: u.id, reelId: id } };
  if (await db.reelLike.findUnique({ where: key })) { await db.reelLike.delete({ where: key }); return ok({ liked: false }); }
  await db.reelLike.create({ data: { userId: u.id, reelId: id } });
  return ok({ liked: true });
});
