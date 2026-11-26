import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";

/**
 * DELETE /api/conversations/:id — "delete chat" for me only: the chat and its messages disappear
 * from my inbox; the other person keeps theirs. A new message brings the chat back (newer messages only).
 */
export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const u = await requireUser();
  const { id } = await params;
  const key = { conversationId_userId: { conversationId: id, userId: u.id } };
  if (!(await db.conversationParticipant.findUnique({ where: key }))) throw new HttpError(404, "Söhbət tapılmadı");
  const now = new Date();
  await db.conversationParticipant.update({ where: key, data: { hiddenAt: now, lastReadAt: now } });
  return ok({ ok: true });
});
