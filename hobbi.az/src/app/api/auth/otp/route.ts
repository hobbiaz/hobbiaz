import { db } from "@/lib/db";
import { route, ok, HttpError } from "@/lib/http";
import { otpRequestSchema } from "@/lib/validators";
import { createOtp } from "@/lib/otp";
import { otpMail, sendMail } from "@/lib/email";
import { emailConfigured, isProduction } from "@/lib/env";
import { clientIp, otpEmailLimiter, otpIpLimiter } from "@/lib/rate-limit";

/** Sends a 6-digit code to the e-mail (sign-up confirmation or password reset). */
export const POST = route(async (req) => {
  const d = otpRequestSchema.parse(await req.json());
  if (!(await otpIpLimiter.hit(clientIp(req))) || !(await otpEmailLimiter.hit(d.email)))
    throw new HttpError(429, "Çox sayda kod istənilib. Bir az sonra yenidən yoxlayın");

  const user = await db.user.findUnique({ where: { email: d.email }, select: { id: true } });
  if (d.purpose === "SIGNUP" && user) throw new HttpError(409, "Bu e-poçt artıq qeydiyyatdan keçib. Daxil olun");
  // Reset: answer the same way whether or not the account exists (no account enumeration).
  if (d.purpose === "RESET" && !user) return ok({ sent: true });

  const code = await createOtp(d.email, d.purpose);
  const sent = await sendMail(otpMail(d.email, code, d.purpose));
  if (!sent) throw new HttpError(502, "Kodu göndərmək alınmadı. Bir az sonra yenidən yoxlayın");
  // Local development without an e-mail provider: hand the code back so the flow is testable.
  const devCode = !isProduction() && !emailConfigured() ? code : undefined;
  return ok({ sent: true, devCode });
});
