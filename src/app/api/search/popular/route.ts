import { db } from "@/lib/db";
import { route, ok } from "@/lib/http";

/** GET /api/search/popular — the 3 most searched texts. */
export const GET = route(async () => {
  const rows = await db.searchTerm.findMany({ orderBy: [{ count: "desc" }, { updatedAt: "desc" }], take: 3 });
  return ok(rows.map((r) => r.term));
});
