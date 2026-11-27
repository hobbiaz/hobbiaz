import { db } from "@/lib/db";
import { route, ok, requireUser } from "@/lib/http";

/**
 * Notifications are derived from real events (no separate table): new orders for my store,
 * status changes of my orders, and new messages. POST marks them all as seen.
 */
export const GET = route(async () => {
  const u = await requireUser();
  const me = await db.user.findUnique({ where: { id: u.id }, select: { notificationsSeenAt: true } });
  const seen = me?.notificationsSeenAt ?? new Date(0);
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [incoming, mine, parts] = await Promise.all([
    db.order.findMany({ where: { sellerId: u.id, createdAt: { gt: since } }, orderBy: { createdAt: "desc" }, take: 20, include: { buyer: { select: { name: true } } } }),
    db.order.findMany({ where: { buyerId: u.id, updatedAt: { gt: since }, status: { not: "PENDING" } }, orderBy: { updatedAt: "desc" }, take: 20 }),
    db.conversationParticipant.findMany({ where: { userId: u.id }, select: { conversationId: true, lastReadAt: true } }),
  ]);
  const unreadByConv = await Promise.all(parts.map((p) =>
    db.message.findFirst({
      where: { conversationId: p.conversationId, senderId: { not: u.id }, ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}) },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { name: true, store: { select: { name: true } } } } },
    })));
  const unreadMessages = unreadByConv.filter(Boolean).length;

  const STATUS: Record<string, string> = { ACCEPTED: "qəbul edildi ✅", REJECTED: "rədd edildi", COMPLETED: "tamamlandı 🎉", CANCELLED: "ləğv edildi" };
  const items = [
    ...incoming.map((o) => ({ id: `o-${o.id}`, icon: "🛒", title: "Yeni sifariş", text: `${o.buyer.name}: "${o.title}"`, at: o.createdAt, href: "/profile" })),
    ...mine.map((o) => ({ id: `s-${o.id}-${o.status}`, icon: "📦", title: "Sifariş statusu", text: `"${o.title}" ${STATUS[o.status] ?? o.status}`, at: o.updatedAt, href: "/profile" })),
    ...unreadByConv.flatMap((m) => (m ? [{ id: `m-${m.id}`, icon: "💬", title: m.sender.store?.name ?? m.sender.name, text: m.body.slice(0, 80), at: m.createdAt, href: `/messages?c=${m.conversationId}` }] : [])),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 30)
    .map((n) => ({ ...n, at: n.at.toISOString(), unread: n.at > seen }));

  return ok({ items, unread: items.filter((n) => n.unread).length, unreadMessages });
});

export const POST = route(async () => {
  const u = await requireUser();
  await db.user.update({ where: { id: u.id }, data: { notificationsSeenAt: new Date() } });
  return ok({ ok: true });
});
