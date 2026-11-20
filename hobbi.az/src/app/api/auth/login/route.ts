import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { route, ok, HttpError } from "@/lib/http";
import { loginSchema } from "@/lib/validators";
import { clientIp, loginLimiter } from "@/lib/rate-limit";

// Hash of a random string, made once: comparing against it for unknown e-mails makes
// both failure paths take the same time, so response timing does not reveal accounts.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword(randomBytes(16).toString("hex")));

export const POST = route(async (req) => {
  const d = loginSchema.parse(await req.json());
  const key = `${clientIp(req)}:${d.email}`;
  if (!loginLimiter.hit(key)) throw new HttpError(429, "Çox sayda cəhd. 15 dəqiqə sonra yenidən yoxlayın");
  const user = await db.user.findUnique({ where: { email: d.email } });
  const valid = await verifyPassword(d.password, user?.passwordHash ?? (await getDummyHash()));
  // Same message for unknown email and wrong password
  if (!user || !valid) throw new HttpError(401, "E-poçt və ya şifrə yanlışdır");
  loginLimiter.reset(key);
  await createSession(user.id);
  return ok({ id: user.id, name: user.name, role: user.role });
});
