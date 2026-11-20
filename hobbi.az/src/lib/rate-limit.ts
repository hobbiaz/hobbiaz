import { upstashConfigured } from "./env";

/**
 * Fixed-window rate limiter. With UPSTASH_REDIS_REST_* set it counts in Redis (shared by
 * every server instance, required on Vercel); otherwise it counts in this process's memory.
 */
type Bucket = { count: number; resetAt: number };

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  constructor(private name: string, private limit: number, private windowMs: number) {}

  /** In-memory check (synchronous; used directly by tests). */
  hitLocal(key: string, now = Date.now()): boolean {
    const b = this.buckets.get(key);
    if (!b || b.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      if (this.buckets.size > 10_000) this.prune(now);
      return true;
    }
    b.count++;
    return b.count <= this.limit;
  }

  /** Returns true when the call is allowed. Fails open if Redis is unreachable. */
  async hit(key: string): Promise<boolean> {
    if (!upstashConfigured()) return this.hitLocal(key);
    try {
      const count = await redisIncr(`rl:${this.name}:${key}`, Math.ceil(this.windowMs / 1000));
      return count <= this.limit;
    } catch (e) {
      console.error("[rate-limit] redis error, falling back to memory", e);
      return this.hitLocal(key);
    }
  }

  async reset(key: string) {
    this.buckets.delete(key);
    if (upstashConfigured()) await redis(["DEL", `rl:${this.name}:${key}`]).catch(() => {});
  }

  private prune(now: number) {
    for (const [k, b] of this.buckets) if (b.resetAt <= now) this.buckets.delete(k);
  }
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}

async function redisIncr(key: string, ttlSeconds: number): Promise<number> {
  const count = Number(await redis(["INCR", key]));
  if (count === 1) await redis(["EXPIRE", key, ttlSeconds]);
  return count;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

export const loginLimiter = new RateLimiter("login", 10, 15 * 60_000);
export const registerLimiter = new RateLimiter("register", 5, 60 * 60_000);
export const uploadLimiter = new RateLimiter("upload", 60, 60 * 60_000);
/** OTP e-mails: 5 per hour per address and 20 per hour per IP. */
export const otpEmailLimiter = new RateLimiter("otp-email", 5, 60 * 60_000);
export const otpIpLimiter = new RateLimiter("otp-ip", 20, 60 * 60_000);
export const writeLimiter = new RateLimiter("write", 60, 60_000);
