import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { newConversationSchema } from "@/lib/validators";

export const GET = route(async () => {
  const u = await requireUser();
  return ok(await db.conversation.findMany({
    where: { participants: { some: { userId: u.id } } },
    include: { participants: { include: { user: { select: { id: true, name: true } } } }, messages: { orderBy: { createdAt: "desc" }, take: 1 }, listing: { select: { id: true, title: true } } },
  }));
});

export const POST = route(async (req) => {
  const u = await requireUser();
  const d = newConversationSchema.parse(await req.json());
  if (d.recipientId === u.id) throw new HttpError(400, "Özünüzə mesaj yaza bilməzsiniz");
  if (!(await db.user.findUnique({ where: { id: d.recipientId }, select: { id: true } }))) throw new HttpError(404, "İstifadəçi tapılmadı");
  if (d.listingId && !(await db.listing.findFirst({ where: { id: d.listingId, status: "PUBLISHED" }, select: { id: true } }))) throw new HttpError(404, "Elan tapılmadı");
  let conv = await db.conversation.findFirst({
    where: { listingId: d.listingId ?? null, AND: [{ participants: { some: { userId: u.id } } }, { participants: { some: { userId: d.recipientId } } }] },
  });
  if (!conv) conv = await db.conversation.create({ data: { listingId: d.listingId, participants: { create: [{ userId: u.id }, { userId: d.recipientId }] } } });
  await db.message.create({ data: { conversationId: conv.id, senderId: u.id, body: d.body } });
  return ok({ id: conv.id }, 201);
});
