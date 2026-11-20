import { db } from "@/lib/db";
import { checkEnv, emailConfigured, r2Configured, upstashConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Uptime check: GET /api/health → 200 when the app and database work, 503 otherwise. */
export async function GET() {
  const env = checkEnv();
  let database = false;
  try {
    await db.$queryRaw`SELECT 1`;
    database = true;
  } catch { /* reported below */ }
  const ok = database && env.ok;
  return Response.json(
    {
      ok,
      database,
      env: { ok: env.ok, missing: env.missing },
      services: { storage: r2Configured() ? "r2" : "local", rateLimit: upstashConfigured() ? "upstash" : "memory", email: emailConfigured() ? "resend" : "console" },
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
