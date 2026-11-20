import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { route, ok, HttpError } from "@/lib/http";
import { passwordResetSchema } from "@/lib/validators";
import { OTP_MESSAGES, verifyOtp } from "@/lib/otp";

/** Sets a new password using a RESET code from /api/auth/otp, then signs the user in. */
export const POST = route(async (req) => {
  const d = passwordResetSchema.parse(await req.json());
  const result = await verifyOtp(d.email, "RESET", d.code);
  if (result !== "ok") throw new HttpError(400, OTP_MESSAGES[result]);
  const user = await db.user.findUnique({ where: { email: d.email }, select: { id: true } });
  if (!user) throw new HttpError(400, OTP_MESSAGES.invalid);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(d.password) } });
  await createSession(user.id);
  return ok({ ok: true });
});
