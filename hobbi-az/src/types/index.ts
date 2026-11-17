/** Category slugs used by the home feed filters (kept identical to the legacy markup). */
export type CategorySlug = "all" | "keramika" | "resm" | "zergerllik" | "toxuculuq" | "agac" | "musiqi" | "digər";

export interface Product {
  id: number;
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
}

export interface Review {
  id: number;
  user: string;
  avatar: string;
  text: string;
  images: string[];
  replies: { user: string; text: string }[];
}

export interface Reel {
  id: number;
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
