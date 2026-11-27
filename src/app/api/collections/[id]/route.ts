import { route, ok, HttpError } from "@/lib/http";
import { getCollection } from "@/lib/collections";

/** GET /api/collections/:id — a curated slug (e.g. "ev-dekoru") or a user collection id. */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const { id } = await params;
  if (!/^[\w-]{1,64}$/.test(id)) throw new HttpError(404, "Kolleksiya tapılmadı");
  const c = await getCollection(id);
  if (!c) throw new HttpError(404, "Kolleksiya tapılmadı");
  return ok(c);
});
