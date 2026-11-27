import { route, ok, HttpError } from "@/lib/http";
import { otpVerifySchema } from "@/lib/validators";
import { issueVerificationToken, OTP_MESSAGES, verifyOtp } from "@/lib/otp";

/** Checks the code and returns a short-lived token that /api/auth/register accepts. */
export const POST = route(async (req) => {
  const d = otpVerifySchema.parse(await req.json());
  const result = await verifyOtp(d.email, d.purpose, d.code);
  if (result !== "ok") throw new HttpError(400, OTP_MESSAGES[result]);
  return ok({ token: await issueVerificationToken(d.email, d.purpose) });
});
