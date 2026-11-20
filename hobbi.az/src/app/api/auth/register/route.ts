import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { route, ok, HttpError } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { clientIp, registerLimiter } from "@/lib/rate-limit";

export const POST = route(async (req) => {
  if (!registerLimiter.hit(clientIp(req))) throw new HttpError(429, "Çox sayda qeydiyyat cəhdi. Bir az sonra yenidən yoxlayın");
  const d = registerSchema.parse(await req.json());
  if (await db.user.findUnique({ where: { email: d.email }, select: { id: true } }))
    throw new HttpError(409, "Bu e-poçt artıq qeydiyyatdan keçib");
  const user = await db.user.create({
    data: { name: d.name, email: d.email, role: d.role, passwordHash: await hashPassword(d.password) },
    select: { id: true, name: true, role: true },
  });
  await createSession(user.id);
  return ok(user, 201);
});
