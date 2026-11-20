import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentUser, type SessionUser } from "./auth";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function sameOrigin(origin: string | null, host: string | null, appOrigin?: string): boolean {
  if (!origin) return false;
  if (appOrigin && origin === appOrigin) return true;
  try { return !!host && new URL(origin).host === host; } catch { return false; }
}

export function assertSameOrigin(req: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  if (!sameOrigin(req.headers.get("origin"), req.headers.get("host"), process.env.APP_ORIGIN))
    throw new HttpError(403, "Sorğu mənbəyi etibarsızdır");
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) throw new HttpError(401, "Daxil olmalısınız");
  return u;
}
export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new HttpError(403, "İcazə yoxdur");
  return u;
}

type Ctx<P> = { params: Promise<P> };
export function route<P = Record<string, never>>(fn: (req: Request, ctx: Ctx<P>) => Promise<Response>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Yanlış məlumat", issues: e.issues }, { status: 400 });
      if (e instanceof SyntaxError) return NextResponse.json({ error: "Sorğunun gövdəsi JSON deyil" }, { status: 400 });
      if (e instanceof Prisma.PrismaClientInitializationError) {
        console.error("[db] connection failed — is DATABASE_URL set in .env?", e.message);
        return NextResponse.json({ error: "Verilənlər bazası əlçatan deyil" }, { status: 503 });
      }
      console.error(e);
      return NextResponse.json({ error: "Server xətası" }, { status: 500 });
    }
  };
}
export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** True for a unique-constraint violation (e.g. two concurrent "like" requests). */
export const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
