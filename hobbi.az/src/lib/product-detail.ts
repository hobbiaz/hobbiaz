import type { Product, Review } from "@/types";

export interface ProductDetail {
  id: number;
  title: string;
  images: string[];
  phone: string;
  postedAt: string;
  location: string;
  price: string;
  oldPrice: string | null;
  rating: string;
  creator: { name: string; avatar: string };
  description: string;
  reviews: Review[];
  likesCount: number;
}

const SELLER_AVATAR = "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=60&h=60&fit=crop&crop=face";

const DEFAULT_REVIEWS: Review[] = [
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
export function toDetail(p: Product): ProductDetail {
  return {
    id: p.id,
    title: p.title,
    images: p.images?.length ? p.images : [p.photo],
    phone: p.phone || "+994 50 000 00 00",
    postedAt: "2 saat əvvəl",
    location: "Bakı, Azərbaycan",
    price: `${p.price || "45"} AZN`,
    oldPrice: p.oldPrice ? `${p.oldPrice} AZN` : null,
    rating: "5",
    creator: { name: p.shop || "Hobbi.az", avatar: SELLER_AVATAR },
    description: p.desc || `${p.title} — əl işi, unikal dizayn. Hər bir məhsul xüsusi hazırlanır.`,
    reviews: DEFAULT_REVIEWS.map((r) => ({ ...r, replies: [...r.replies] })),
    // deterministic stand-in for a real like counter (20–219)
    likesCount: ((p.id * 37) % 200) + 20,
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
