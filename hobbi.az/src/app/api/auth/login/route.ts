import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { route, ok, HttpError } from "@/lib/http";
import { loginSchema } from "@/lib/validators";

export const POST = route(async (req) => {
  const d = loginSchema.parse(await req.json());
  const user = await db.user.findUnique({ where: { email: d.email } });
  // Same message for unknown email and wrong password
  if (!user || !(await verifyPassword(d.password, user.passwordHash)))
    throw new HttpError(401, "E-poçt və ya şifrə yanlışdır");
  await createSession(user.id);
  return ok({ id: user.id, name: user.name, role: user.role });
});
