import { db } from "@/lib/db";
import { route, ok, requireAdmin } from "@/lib/http";
import { listingInclude, toProduct } from "@/lib/listing-dto";

/** Admin dashboard numbers + the latest listings (any status) for moderation. */
export const GET = route(async () => {
  await requireAdmin();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [users, stores, published, removed, orders, openReports, newUsers, latest] = await Promise.all([
    db.user.count(),
    db.store.count(),
    db.listing.count({ where: { status: "PUBLISHED" } }),
    db.listing.count({ where: { status: "REMOVED" } }),
    db.order.count(),
    db.report.count({ where: { status: "OPEN" } }),
    db.user.count({ where: { createdAt: { gt: weekAgo } } }),
    db.listing.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: listingInclude }),
  ]);
  return ok({ users, stores, published, removed, orders, openReports, newUsers, latest: latest.map(toProduct) });
});
