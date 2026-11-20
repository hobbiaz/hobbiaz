import { destroySession } from "@/lib/auth";
import { route, ok } from "@/lib/http";
export const POST = route(async () => { await destroySession(); return ok({ ok: true }); });
