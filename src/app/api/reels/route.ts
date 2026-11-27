import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { getStorage } from "@/lib/storage";
import { MAX_VIDEO_BYTES, sniffVideo } from "@/lib/image-sniff";
import { reelCreateSchema } from "@/lib/validators";
import { writeLimiter } from "@/lib/rate-limit";

const reelInclude = (meId?: string) => ({
  owner: { select: { id: true, name: true, phone: true, city: true, store: { select: { name: true, slug: true, region: true, phone: true, avatarUrl: true } } } },
  _count: { select: { likes: true, comments: true } },
  likes: meId ? { where: { userId: meId }, select: { userId: true } } : false,
}) as const;

/** GET /api/reels[?q=text] — newest videos; `q` searches the title and the author / store name. */
export const GET = route(async (req) => {
  const me = await getCurrentUser();
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 80);
  const where = q
    ? { OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { owner: { name: { contains: q, mode: "insensitive" as const } } },
        { owner: { store: { name: { contains: q, mode: "insensitive" as const } } } },
      ] }
    : {};
  const reels = await db.reel.findMany({ where, orderBy: { createdAt: "desc" }, take: q ? 60 : 30, include: reelInclude(me?.id) });
  return ok(reels.map(({ likes, ...r }) => ({ ...r, likedByMe: Array.isArray(likes) && likes.length > 0 })));
});

/** POST /api/reels { key, title } — publish a video uploaded via /api/reels/upload-url. Stores only. */
export const POST = route(async (req) => {
  const user = await requireUser();
  if (user.role === "BUYER") throw new HttpError(403, "Video paylaşmaq üçün mağaza açın");
  if (!(await writeLimiter.hit(user.id))) throw new HttpError(429, "Çox sürətli. Bir az gözləyin");
  const d = reelCreateSchema.parse(await req.json());
  const slot = await db.upload.findUnique({ where: { key: d.key } });
  if (!slot || slot.ownerId !== user.id) throw new HttpError(403, "Bu fayl sizə aid deyil");
  if (await db.reel.findFirst({ where: { videoUrl: `/api/media/${d.key}` }, select: { id: true } })) throw new HttpError(409, "Bu video artıq paylaşılıb");
  const storage = getStorage();
  const size = await storage.size(d.key);
  if (!size) throw new HttpError(400, "Video yüklənməyib, yenidən cəhd edin");
  const type = sniffVideo((await storage.head(d.key, 16)) ?? new Uint8Array());
  if (size > MAX_VIDEO_BYTES || !type || type.ext !== d.key.split(".")[1]) {
    await storage.remove(d.key).catch(() => {});
    await db.upload.delete({ where: { key: d.key } }).catch(() => {});
    throw new HttpError(415, size > MAX_VIDEO_BYTES ? "Video 100 MB-dan böyükdür" : "Fayl video deyil (MP4, WebM və ya MOV olmalıdır)");
  }
  await db.upload.update({ where: { key: d.key }, data: { size } });
  const reel = await db.reel.create({
    data: { ownerId: user.id, title: d.title, videoUrl: `/api/media/${d.key}` },
    include: reelInclude(user.id),
  });
  const { likes: _likes, ...rest } = reel;
  return ok({ ...rest, likedByMe: false }, 201);
});
