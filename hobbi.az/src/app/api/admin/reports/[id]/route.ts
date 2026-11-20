import { z } from "zod";
import { db } from "@/lib/db";
import { route, ok, requireAdmin, HttpError } from "@/lib/http";

/** PATCH /api/admin/reports/:id { status: "DISMISSED" | "RESOLVED" } */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireAdmin();
  const { id } = await params;
  const { status } = z.object({ status: z.enum(["DISMISSED", "RESOLVED"]) }).parse(await req.json());
  const r = await db.report.findUnique({ where: { id }, select: { id: true } });
  if (!r) throw new HttpError(404, "Şikayət tapılmadı");
  return ok(await db.report.update({ where: { id }, data: { status } }));
});
