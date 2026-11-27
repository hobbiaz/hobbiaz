import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { imageUrl, listingInclude, toProduct } from "@/lib/listing-dto";
import { COLLECTION_CATEGORIES, SEARCH_COLLECTIONS } from "@/data/content";
import type { CollectionDetail, CollectionSummary, Product } from "@/types";

/** A user collection holds 8–20 listings. */
export const COLLECTION_MIN = 8;
export const COLLECTION_MAX = 20;

const CURATED_IDS = new Set<string>(SEARCH_COLLECTIONS.map((c) => c.slug));
export const isCuratedId = (id: string) => CURATED_IDS.has(id);

const firstImage = { images: { orderBy: { position: "asc" }, take: 1 } } satisfies Prisma.ListingInclude;
const photoOf = (l: { images: { url: string | null; storageKey: string | null }[] }) => (l.images[0] ? imageUrl(l.images[0]) : "");

function curatedWhere(slug: keyof typeof COLLECTION_CATEGORIES): Prisma.ListingWhereInput {
  return { status: "PUBLISHED", category: { slug: { in: COLLECTION_CATEGORIES[slug] } } };
}

/** Curated collections first, then the newest user collections. */
export async function listCollections(limit = 24): Promise<CollectionSummary[]> {
  const curated = await Promise.all(
    SEARCH_COLLECTIONS.map(async (c) => {
      const where = curatedWhere(c.slug);
      const [first, count] = await Promise.all([
        db.listing.findMany({ where, orderBy: { createdAt: "desc" }, take: 4, include: firstImage }),
        db.listing.count({ where }),
      ]);
      return {
        id: c.slug, title: c.desktopTitle, count, curated: true, trending: c.trending,
        images: first.map(photoOf), updatedAt: first[0]?.createdAt.toISOString(),
      } satisfies CollectionSummary;
    }),
  );
  const own = await db.collection.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      owner: { select: { name: true, store: { select: { name: true } } } },
      items: {
        where: { listing: { status: "PUBLISHED" } },
        orderBy: { position: "asc" },
        include: { listing: { include: firstImage } },
      },
    },
  });
  const users = own
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      id: c.id, title: c.title, count: c.items.length, curated: false,
      images: c.items.slice(0, 4).map((i) => photoOf(i.listing)),
      updatedAt: c.createdAt.toISOString(),
      ownerName: c.owner.store?.name ?? c.owner.name,
    }) satisfies CollectionSummary);
  return [...curated, ...users];
}

/** One collection with its products, or null. */
export async function getCollection(id: string): Promise<CollectionDetail | null> {
  const curated = SEARCH_COLLECTIONS.find((c) => c.slug === id);
  if (curated) {
    const listings = await db.listing.findMany({ where: curatedWhere(curated.slug), orderBy: { createdAt: "desc" }, take: 60, include: listingInclude });
    const items = listings.map(toProduct);
    return summaryOf({ id, title: curated.desktopTitle, curated: true, trending: curated.trending }, items);
  }
  const c = await db.collection.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, store: { select: { name: true } } } },
      items: { where: { listing: { status: "PUBLISHED" } }, orderBy: { position: "asc" }, include: { listing: { include: listingInclude } } },
    },
  });
  if (!c) return null;
  const items = c.items.map((i) => toProduct(i.listing));
  return { ...summaryOf({ id: c.id, title: c.title, curated: false, ownerName: c.owner.store?.name ?? c.owner.name }, items), updatedAt: c.createdAt.toISOString() };
}

function summaryOf(base: Omit<CollectionSummary, "count" | "images">, items: Product[]): CollectionDetail {
  return { ...base, count: items.length, images: items.slice(0, 4).map((p) => p.photo), updatedAt: items[0]?.createdAt, items };
}
