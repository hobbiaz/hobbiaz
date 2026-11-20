import { db } from "@/lib/db";
import { route, ok } from "@/lib/http";

/** GET /api/stores/check?name=… → { available } (brand-name step of the onboarding). */
export const GET = route(async (req) => {
  const name = (new URL(req.url).searchParams.get("name") ?? "").trim();
  if (name.length < 4 || name.length > 40) return ok({ available: false });
  const taken = await db.store.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true } });
  return ok({ available: !taken });
});
