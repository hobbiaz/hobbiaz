import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { listingInclude, toProduct } from "@/lib/listing-dto";
import { StorePage } from "@/components/store/StorePage";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const store = await db.store.findUnique({ where: { slug } }).catch(() => null);
  if (!store) return null;
  const [listings, rating] = await Promise.all([
    db.listing.findMany({ where: { ownerId: store.ownerId, status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 60, include: listingInclude }),
    db.review.aggregate({ where: { listing: { ownerId: store.ownerId } }, _avg: { rating: true }, _count: true }),
  ]);
  return { store, products: listings.map(toProduct), rating: rating._avg.rating ? Number(rating._avg.rating.toFixed(1)) : null, reviewCount: rating._count };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return { title: "Mağaza tapılmadı" };
  return {
    title: data.store.name,
    description: data.store.bio ?? `${data.store.name}: ${data.store.region} — hobbi.az-da əl işi məhsullar`,
    openGraph: { title: data.store.name, images: data.store.avatarUrl ? [data.store.avatarUrl] : undefined },
  };
}

/** Public store page: /s/<slug> (shared from the profile). */
export default async function Page({ params }: Props) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { store, products, rating, reviewCount } = data;
  return (
    <StorePage
      store={{ name: store.name, region: store.region, avatarUrl: store.avatarUrl, bio: store.bio, instagram: store.instagram, tiktok: store.tiktok, since: store.createdAt.toISOString() }}
      products={products}
      rating={rating}
      reviewCount={reviewCount}
    />
  );
}
