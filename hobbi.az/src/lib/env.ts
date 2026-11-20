/**
 * Server environment check. Runs once at boot (src/instrumentation.ts) so a missing
 * secret fails loudly at startup instead of as a random 500 later.
 */
export interface EnvReport {
  ok: boolean;
  missing: string[];
  warnings: string[];
}

const has = (k: string) => Boolean(process.env[k]?.trim());

export const isProduction = () => process.env.NODE_ENV === "production";
/** Vercel's filesystem is read-only, so uploads must go to R2 there. */
export const onVercel = () => Boolean(process.env.VERCEL);

export const r2Configured = () =>
  ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"].every(has);
export const upstashConfigured = () => has("UPSTASH_REDIS_REST_URL") && has("UPSTASH_REDIS_REST_TOKEN");
export const emailConfigured = () => has("RESEND_API_KEY") && has("EMAIL_FROM");

export function checkEnv(): EnvReport {
  const missing: string[] = [];
  const warnings: string[] = [];
  for (const k of ["DATABASE_URL", "DIRECT_URL", "AUTH_SECRET"]) if (!has(k)) missing.push(k);
  if (has("AUTH_SECRET") && process.env.AUTH_SECRET!.length < 32) missing.push("AUTH_SECRET (32+ simvol)");

  if (isProduction()) {
    if (!has("APP_ORIGIN")) missing.push("APP_ORIGIN");
    if (onVercel() && !r2Configured()) missing.push("R2_* (Vercel-də şəkil yükləmək üçün)");
    if (!emailConfigured()) warnings.push("RESEND_API_KEY/EMAIL_FROM yoxdur: OTP kodları göndərilməyəcək");
    if (!upstashConfigured()) warnings.push("UPSTASH_* yoxdur: rate limit yalnız bir instansda işləyir");
  }
  return { ok: missing.length === 0, missing, warnings };
}
