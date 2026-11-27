import type { Product, Review } from "@/types";
import { timeAgo } from "./api-client";

export interface ProductDetail {
  id: string;
  title: string;
  images: string[];
  phone: string;
  postedAt: string;
  location: string;
  price: string;
  oldPrice: string | null;
  rating: string | null;
  creator: { name: string; avatar: string; slug?: string; ownerId?: string; instagram?: string; tiktok?: string };
  description: string;
  /** Built-in reviews for demo products; real ones are loaded from the API. */
  demoReviews: Review[];
  likesCount: number;
}

const DEMO_SELLER_AVATAR = "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=60&h=60&fit=crop&crop=face";

const DEMO_REVIEWS: Review[] = [
  {
    id: 1, user: "Aynur", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face",
    text: "Çox gözəl məhsul, gözləntilərimə tam cavab verdi!", images: [], replies: [],
  },
  {
    id: 2, user: "Elçin", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face",
    text: "Keyfiyyəti mükəmməldir. Tövsiyə edirəm.", images: [], replies: [{ user: "Satıcı", text: "Təşəkkür edirik! 😊" }],
  },
];

/** Expands a catalogue product into the richer model the detail panel renders. */
export function toDetail(p: Product & { rating?: number | null }): ProductDetail {
  const demo = p.id.startsWith("demo-");
  const seed = [...p.id].reduce((n, c) => n + c.charCodeAt(0), 0);
  return {
    id: p.id,
    title: p.title,
    images: p.images?.length ? p.images : p.photo ? [p.photo] : [],
    phone: p.phone,
    postedAt: demo ? "2 saat əvvəl" : timeAgo(p.createdAt),
    location: p.city ? `${p.city}, Azərbaycan` : "Azərbaycan",
    price: `${p.price} AZN`,
    oldPrice: p.oldPrice ? `${p.oldPrice} AZN` : null,
    rating: demo ? "5" : p.rating ? String(p.rating) : null,
    creator: { name: p.shop || "hobbi.az", avatar: demo ? DEMO_SELLER_AVATAR : p.sellerAvatar ?? "", slug: p.storeSlug, ownerId: p.ownerId, instagram: p.instagram, tiktok: p.tiktok },
    description: p.desc,
    demoReviews: demo ? DEMO_REVIEWS.map((r) => ({ ...r, replies: [...r.replies] })) : [],
    // demo: deterministic stand-in counter; real: number of users who saved it
    likesCount: demo ? (seed * 37) % 200 + 20 : p.favoriteCount ?? 0,
  };
}

export const DESC_PREVIEW = 80;
export const shortDescription = (text: string) => (text.length > DESC_PREVIEW ? text.substring(0, DESC_PREVIEW) + "..." : text);

export interface AdData {
  logo: string;
  title: string;
  sub: string;
  link: string;
}

/** House ad (no third-party brand): invites makers to open a store. */
export const DEFAULT_AD: AdData = {
  logo: "/logo.svg",
  title: "Mağaza aç",
  sub: "hobbi.az: əl işlərini sat",
  link: "",
};
