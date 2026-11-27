import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { OtpPurpose } from "@prisma/client";
import { db } from "./db";

const CODE_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;
const TOKEN_TTL = "30m";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ characters)");
  return s;
}
const hashCode = (email: string, code: string) => createHmac("sha256", secret()).update(`${email}:${code}`).digest("hex");

/** Creates a fresh 6-digit code (older unused codes for the same purpose stop working). */
export async function createOtp(email: string, purpose: OtpPurpose): Promise<string> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.$transaction([
    db.otpCode.updateMany({ where: { email, purpose, consumedAt: null }, data: { consumedAt: new Date() } }),
    db.otpCode.create({ data: { email, purpose, codeHash: hashCode(email, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) } }),
  ]);
  return code;
}

export type OtpResult = "ok" | "invalid" | "expired" | "too_many";

/** Checks a code; each wrong guess counts, and after 5 the code is dead. */
export async function verifyOtp(email: string, purpose: OtpPurpose, code: string): Promise<OtpResult> {
  const otp = await db.otpCode.findFirst({ where: { email, purpose, consumedAt: null }, orderBy: { createdAt: "desc" } });
  if (!otp) return "expired";
  if (otp.expiresAt < new Date()) return "expired";
  if (otp.attempts >= MAX_ATTEMPTS) return "too_many";
  const a = Buffer.from(otp.codeHash, "hex");
  const b = Buffer.from(hashCode(email, code), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return otp.attempts + 1 >= MAX_ATTEMPTS ? "too_many" : "invalid";
  }
  await db.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return "ok";
}

export const OTP_MESSAGES: Record<Exclude<OtpResult, "ok">, string> = {
  invalid: "Kod yanlışdır",
  expired: "Kodun vaxtı bitib, yenisini istəyin",
  too_many: "Çox sayda yanlış cəhd. Yeni kod istəyin",
};

/** Short-lived proof that `email` passed OTP for `purpose`; sent back with the next request. */
export async function issueVerificationToken(email: string, purpose: OtpPurpose) {
  return new SignJWT({ purpose, typ: "otp" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(new TextEncoder().encode(secret()));
}

export async function readVerificationToken(token: string, purpose: OtpPurpose): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret()), { algorithms: ["HS256"] });
    if (payload.typ !== "otp" || payload.purpose !== purpose || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}
