import { db } from "@/lib/db";
import { route, ok, requireUser } from "@/lib/http";
import { profileSchema } from "@/lib/validators";

export const GET = route(async () => {
  const u = await requireUser();
  return ok(await db.user.findUnique({ where: { id: u.id }, select: { id: true, email: true, name: true, phone: true, city: true, bio: true, role: true } }));
});
export const PATCH = route(async (req) => {
  const u = await requireUser();
  const d = profileSchema.parse(await req.json());
  return ok(await db.user.update({ where: { id: u.id }, data: d, select: { id: true, name: true, phone: true, city: true, bio: true } }));
});
