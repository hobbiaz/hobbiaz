/**
 * Fixed-window, in-memory rate limiter. It is per server instance: good enough for a
 * single Node process / dev, but use a shared store (e.g. Redis/Upstash) when the app
 * runs on several instances or serverless.
 */
type Bucket = { count: number; resetAt: number };

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  constructor(private limit: number, private windowMs: number) {}

  /** Returns true when the call is allowed, false when the key is over its limit. */
  hit(key: string, now = Date.now()): boolean {
    const b = this.buckets.get(key);
    if (!b || b.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      if (this.buckets.size > 10_000) this.prune(now);
      return true;
    }
    b.count++;
    return b.count <= this.limit;
  }

  reset(key: string) { this.buckets.delete(key); }

  private prune(now: number) {
    for (const [k, b] of this.buckets) if (b.resetAt <= now) this.buckets.delete(k);
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

/** 10 login attempts / 15 min per IP+email, 5 sign-ups / hour per IP, 60 uploads / hour per user. */
export const loginLimiter = new RateLimiter(10, 15 * 60_000);
export const registerLimiter = new RateLimiter(5, 60 * 60_000);
export const uploadLimiter = new RateLimiter(60, 60 * 60_000);
