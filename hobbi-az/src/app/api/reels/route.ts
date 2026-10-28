import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { route, ok } from "@/lib/http";

export const GET = route(async () => {
  const me = await getCurrentUser();
  const reels = await db.reel.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { owner: { select: { id: true, name: true } }, _count: { select: { likes: true, comments: true } }, likes: me ? { where: { userId: me.id }, select: { userId: true } } : false } });
  return ok(reels.map(({ likes, ...r }) => ({ ...r, likedByMe: Array.isArray(likes) && likes.length > 0 })));
});
