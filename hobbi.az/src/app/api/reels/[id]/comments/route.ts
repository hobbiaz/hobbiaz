import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { commentSchema } from "@/lib/validators";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const { id } = await params;
  return ok(await db.reelComment.findMany({ where: { reelId: id }, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { id: true, name: true } } } }));
});
export const POST = route<{ id: string }>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  if (!(await db.reel.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, "Video tapılmadı");
  const d = commentSchema.parse(await req.json());
  return ok(await db.reelComment.create({ data: { reelId: id, userId: u.id, body: d.body } }), 201);
});
