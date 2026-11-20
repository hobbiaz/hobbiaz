import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { newConversationSchema } from "@/lib/validators";
import { writeLimiter } from "@/lib/rate-limit";

/** My conversations, most recently active first, with the other person and unread count. */
export const GET = route(async () => {
  const u = await requireUser();
  const convs = await db.conversation.findMany({
    where: { participants: { some: { userId: u.id } } },
    include: {
      participants: { include: { user: { select: { id: true, name: true, avatarUrl: true, store: { select: { name: true, avatarUrl: true, slug: true } } } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      listing: { select: { id: true, title: true, images: { take: 1, orderBy: { position: "asc" } } } },
    },
    take: 100,
  });
  const items = await Promise.all(convs.map(async (c) => {
    const me = c.participants.find((p) => p.userId === u.id);
    const other = c.participants.find((p) => p.userId !== u.id)?.user;
    const unread = await db.message.count({
      where: { conversationId: c.id, senderId: { not: u.id }, ...(me?.lastReadAt ? { createdAt: { gt: me.lastReadAt } } : {}) },
    });
    const last = c.messages[0];
    const img = c.listing?.images[0];
    return {
      id: c.id,
      other: other ? { id: other.id, name: other.store?.name ?? other.name, avatar: other.store?.avatarUrl ?? other.avatarUrl, storeSlug: other.store?.slug } : null,
      listing: c.listing ? { id: c.listing.id, title: c.listing.title, image: img ? img.url ?? `/api/media/${img.storageKey}` : null } : null,
      last: last ? { body: last.body, createdAt: last.createdAt.toISOString(), mine: last.senderId === u.id } : null,
      unread,
      updatedAt: (last?.createdAt ?? c.createdAt).toISOString(),
    };
  }));
  return ok(items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
});

/** Start (or continue) a conversation with a seller, optionally about a listing. */
export const POST = route(async (req) => {
  const u = await requireUser();
  if (!(await writeLimiter.hit(u.id))) throw new HttpError(429, "Çox sürətli. Bir az gözləyin");
  const d = newConversationSchema.parse(await req.json());
  if (d.recipientId === u.id) throw new HttpError(400, "Özünüzə mesaj yaza bilməzsiniz");
  if (!(await db.user.findUnique({ where: { id: d.recipientId }, select: { id: true } }))) throw new HttpError(404, "İstifadəçi tapılmadı");
  if (d.listingId && !(await db.listing.findFirst({ where: { id: d.listingId, status: "PUBLISHED" }, select: { id: true } }))) throw new HttpError(404, "Elan tapılmadı");
  let conv = await db.conversation.findFirst({
    where: { listingId: d.listingId ?? null, AND: [{ participants: { some: { userId: u.id } } }, { participants: { some: { userId: d.recipientId } } }] },
  });
  if (!conv) conv = await db.conversation.create({ data: { listingId: d.listingId, participants: { create: [{ userId: u.id }, { userId: d.recipientId }] } } });
  await db.message.create({ data: { conversationId: conv.id, senderId: u.id, body: d.body } });
  await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId: conv.id, userId: u.id } }, data: { lastReadAt: new Date() } });
  return ok({ id: conv.id }, 201);
});
