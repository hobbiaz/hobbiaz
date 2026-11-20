import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { messageSchema } from "@/lib/validators";

type P = { id: string };
async function assertParticipant(conversationId: string, userId: string) {
  const p = await db.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  if (!p) throw new HttpError(404, "Söhbət tapılmadı");
}

// Refresh/poll based messaging. This is NOT real-time (no WebSocket/SSE).
export const GET = route<P>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  await assertParticipant(id, u.id);
  return ok(await db.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" }, take: 200 }));
});

export const POST = route<P>(async (req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  await assertParticipant(id, u.id);
  const d = messageSchema.parse(await req.json());
  return ok(await db.message.create({ data: { conversationId: id, senderId: u.id, body: d.body } }), 201);
});
