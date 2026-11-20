import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { messageSchema } from "@/lib/validators";
import { writeLimiter } from "@/lib/rate-limit";

type P = { id: string };
async function assertParticipant(conversationId: string, userId: string) {
  const p = await db.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  if (!p) throw new HttpError(404, "Söhbət tapılmadı");
}

// Refresh/poll based messaging (the UI polls every few seconds). Not WebSocket/SSE.
export const GET = route<P>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  await assertParticipant(id, u.id);
  // Latest 200 messages, returned oldest → newest for display.
  const latest = await db.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "desc" }, take: 200 });
  await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId: id, userId: u.id } }, data: { lastReadAt: new Date() } });
  return ok(latest.reverse().map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt.toISOString(), mine: m.senderId === u.id })));
});

export const POST = route<P>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  await assertParticipant(id, u.id);
  if (!(await writeLimiter.hit(u.id))) throw new HttpError(429, "Çox sürətli. Bir az gözləyin");
  const d = messageSchema.parse(await req.json());
  const m = await db.message.create({ data: { conversationId: id, senderId: u.id, body: d.body } });
  await db.conversationParticipant.update({ where: { conversationId_userId: { conversationId: id, userId: u.id } }, data: { lastReadAt: m.createdAt } });
  return ok({ id: m.id, body: m.body, createdAt: m.createdAt.toISOString(), mine: true }, 201);
});
