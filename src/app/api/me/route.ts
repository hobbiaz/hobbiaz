import { db } from "@/lib/db";
import { route, ok, requireUser } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validators";

const select = {
  id: true, email: true, name: true, phone: true, city: true, bio: true, role: true, avatarUrl: true,
  store: { select: { id: true, name: true, slug: true, categorySlug: true, region: true, avatarUrl: true, bio: true, phone: true, instagram: true, tiktok: true } },
} as const;

/** The signed-in user, or null for guests (200 either way, so guests see no console errors). */
export const GET = route(async () => {
  const u = await getCurrentUser();
  if (!u) return ok(null);
  return ok(await db.user.findUnique({ where: { id: u.id }, select }));
});

export const PATCH = route(async (req) => {
  const u = await requireUser();
  const d = profileSchema.parse(await req.json());
  return ok(await db.user.update({ where: { id: u.id }, data: d, select }));
});
