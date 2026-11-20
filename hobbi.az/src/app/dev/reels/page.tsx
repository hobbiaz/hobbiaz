import { db } from "@/lib/db";
import { ReelFeed } from "@/components/ReelFeed";
export const dynamic = "force-dynamic";
export default async function Reels() {
  const reels = await db.reel.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { owner: { select: { name: true } }, _count: { select: { likes: true } } } });
  if (!reels.length) return <p>Hələ video yoxdur.</p>;
  return <ReelFeed reels={reels.map((r) => ({ id: r.id, title: r.title, videoUrl: r.videoUrl, owner: r.owner.name, likes: r._count.likes }))} />;
}
