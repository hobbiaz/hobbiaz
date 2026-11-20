import { db } from "@/lib/db";
import { route, ok, requireAdmin } from "@/lib/http";
export const GET = route(async () => {
  await requireAdmin();
  return ok(await db.report.findMany({ where: { status: "OPEN" }, include: { listing: { select: { id: true, title: true, status: true } }, reporter: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 }));
});
