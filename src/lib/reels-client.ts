import { REELS } from "@/data/content";
import type { Reel } from "@/types";

/** A reel as GET /api/reels returns it. */
export interface ApiReel {
  id: string;
  title: string;
  videoUrl: string;
  createdAt: string;
  owner: { id: string; name: string; phone: string | null; city: string | null; store: { name: string; slug: string; region: string; phone: string | null; avatarUrl: string | null } | null };
  _count: { likes: number; comments: number };
}

const GRADIENTS = ["linear-gradient(135deg,#1a4a40,#006b58,#0a8a6d)", "linear-gradient(135deg,#2d3a4a,#3d5a6a,#4a7a8a)", "linear-gradient(135deg,#4a2d3a,#6a3d5a,#8a4a7a)"];

/** API reel → the shape the reel cards render. */
export function toReel(r: ApiReel, i: number): Reel {
  const name = r.owner.store?.name ?? r.owner.name;
  return {
    id: r.id,
    live: true,
    creator: name.replace(/\s+/g, "_"),
    creatorAvatar: name[0]?.toUpperCase() ?? "?",
    isSeller: Boolean(r.owner.store),
    caption: r.title,
    address: r.owner.store?.region ?? r.owner.city ?? "Azərbaycan",
    phone: r.owner.store?.phone ?? r.owner.phone ?? "",
    ratingCount: r._count.likes,
    commentCount: r._count.comments,
    shareCount: 0,
    gradient: GRADIENTS[i % GRADIENTS.length]!,
    emoji: "🎬",
    title: r.title,
    video: r.videoUrl,
  };
}

/** Demo mode: search the built-in example reels. */
export function searchDemoReels(q: string): Reel[] {
  const t = q.trim().toLocaleLowerCase("az");
  if (!t) return REELS;
  return REELS.filter((r) => [r.title, r.caption, r.creator].some((s) => s.toLocaleLowerCase("az").includes(t)));
}
