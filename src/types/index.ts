/** Category slugs used by the home feed filters (kept identical to the legacy markup). */
export const CATEGORY_SLUGS = ["all", "keramika", "resm", "zergerllik", "toxuculuq", "agac", "musiqi", "digər"] as const;
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export const isCategorySlug = (v: unknown): v is CategorySlug => (CATEGORY_SLUGS as readonly unknown[]).includes(v);

export interface Product {
  /** Database id (cuid) — or "demo-N" for the built-in offline catalogue. */
  id: string;
  title: string;
  /** Price in AZN, as a plain number string ("45"). */
  price: string;
  oldPrice?: string;
  shop: string;
  badge: string | null;
  /** Fallback background when the photo fails to load. */
  color: string;
  cat: CategorySlug;
  emoji: string;
  phone: string;
  photo: string;
  images: string[];
  desc: string;
  liked?: boolean;
  // Present when the product comes from the API:
  ownerId?: string;
  storeSlug?: string;
  sellerAvatar?: string;
  city?: string;
  createdAt?: string;
  status?: "DRAFT" | "PUBLISHED" | "REMOVED";
  favoriteCount?: number;
  reviewCount?: number;
  instagram?: string;
  tiktok?: string;
  isDemo?: boolean;
}

/** The signed-in user as returned by GET /api/me. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "BUYER" | "SELLER" | "ADMIN";
  phone: string | null;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  store: {
    id: string;
    name: string;
    slug: string;
    categorySlug: string;
    region: string;
    avatarUrl: string | null;
    bio: string | null;
    phone: string | null;
    instagram: string | null;
    tiktok: string | null;
  } | null;
}

export interface Review {
  id: number | string;
  user: string;
  avatar: string;
  text: string;
  images: string[];
  replies: { user: string; text: string }[];
  rating?: number;
  createdAt?: string;
  mine?: boolean;
}

export interface Reel {
  /** Database id, or "demo-N" for the built-in examples. */
  id: string;
  /** True for reels stored in the database (comments/likes go to the API). */
  live?: boolean;
  creator: string;
  creatorAvatar: string;
  isSeller: boolean;
  caption: string;
  address: string;
  phone: string;
  ratingCount: number;
  commentCount: number;
  shareCount: number;
  gradient: string;
  emoji: string;
  title: string;
  video?: string;
}

export interface Idea {
  title: string;
  views: string;
  color: string;
  emoji: string;
}

export interface ProfileProduct {
  title: string;
  price: string;
  color: string;
  badge: string | null;
  emoji: string;
}

export interface TrendStore {
  name: string;
  avatar: string;
  initial: string;
  /** Placeholder gradient shown when the avatar fails to load. */
  gradient?: string;
  rating: string;
}

export interface Notification {
  id: number;
  icon: string;
  title: string;
  text: string;
  time: string;
  unread: boolean;
}

export interface Conversation {
  id: number;
  name: string;
  initial: string;
  gradient: string;
  preview: string;
  time: string;
  unread?: boolean;
  online?: boolean;
}

export interface SearchCollection {
  slug: "ev-dekoru" | "ketan-remler" | "hediyyelik" | "deb-aksesuar";
  title: string;
  mobileTitle: string;
  mobileMeta: string;
  desktopTitle: string;
  desktopMeta: string;
  trending: boolean;
  /** Unsplash photo ids for the 2×2 collage. */
  imageIds: string[];
  alt: string;
}

export type Theme = "auto" | "light" | "dark";
export type Lang = "az" | "ru";

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
}

/** A collection card in the search panel: curated (by category) or made by a user. */
export interface CollectionSummary {
  id: string;
  title: string;
  /** Number of products in it. */
  count: number;
  /** Photos of the first 4 products (the 2×2 collage). */
  images: string[];
  /** Newest product / creation time, for "2 gün əvvəl". */
  updatedAt?: string;
  curated: boolean;
  trending?: boolean;
  ownerName?: string;
}

export interface CollectionDetail extends CollectionSummary {
  items: Product[];
}
