import type { Prisma } from "@prisma/client";
import type { CategorySlug, Product } from "@/types";
import { isCategorySlug } from "@/types";

/** Prisma `include` that gives everything the product card / detail panel needs. */
export const listingInclude = {
  images: { orderBy: { position: "asc" } },
  category: true,
  owner: { select: { id: true, name: true, phone: true, avatarUrl: true, store: { select: { name: true, slug: true, avatarUrl: true, region: true, phone: true, instagram: true, tiktok: true } } } },
  _count: { select: { favorites: true, reviews: true } },
} satisfies Prisma.ListingInclude;

export type ListingWithRelations = Prisma.ListingGetPayload<{ include: typeof listingInclude }>;

const CATEGORY_LOOK: Record<CategorySlug, { emoji: string; color: string }> = {
  all: { emoji: "✨", color: "#e8e1d9" },
  keramika: { emoji: "🏺", color: "#e3c9a8" },
  resm: { emoji: "🎨", color: "#d9cbe8" },
  zergerllik: { emoji: "💍", color: "#c8d8e4" },
  toxuculuq: { emoji: "🧶", color: "#e8c4c4" },
  agac: { emoji: "🪵", color: "#d4b896" },
  musiqi: { emoji: "🎸", color: "#c9d6c3" },
  digər: { emoji: "✨", color: "#e8e1d9" },
};

export const imageUrl = (img: { url: string | null; storageKey: string | null }) =>
  img.url ?? (img.storageKey ? `/api/media/${img.storageKey}` : "");

const azn = (cents: number) => {
  const v = cents / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

/** Database listing → the `Product` shape the (legacy-derived) UI renders. */
export function toProduct(l: ListingWithRelations): Product {
  const cat: CategorySlug = isCategorySlug(l.category.slug) ? l.category.slug : "digər";
  const look = CATEGORY_LOOK[cat];
  const images = l.images.map(imageUrl).filter(Boolean);
  const store = l.owner.store;
  return {
    id: l.id,
    title: l.title,
    price: azn(l.priceCents),
    oldPrice: l.oldPriceCents && l.oldPriceCents > l.priceCents ? azn(l.oldPriceCents) : undefined,
    shop: store?.name ?? l.owner.name,
    badge: Date.now() - l.createdAt.getTime() < 7 * 86_400_000 ? "YENİ" : null,
    color: look.color,
    cat,
    emoji: look.emoji,
    phone: l.phone ?? store?.phone ?? l.owner.phone ?? "",
    photo: images[0] ?? "",
    images,
    desc: l.description,
    ownerId: l.ownerId,
    storeSlug: store?.slug,
    sellerAvatar: store?.avatarUrl ?? l.owner.avatarUrl ?? undefined,
    city: l.city,
    createdAt: l.createdAt.toISOString(),
    status: l.status,
    favoriteCount: l._count.favorites,
    reviewCount: l._count.reviews,
    instagram: store?.instagram ?? undefined,
    tiktok: store?.tiktok ?? undefined,
    isDemo: l.isDemo,
  };
}
