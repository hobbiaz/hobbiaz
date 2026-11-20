import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatAzn } from "@/lib/format";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ReportButton } from "@/components/ReportButton";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, l] = await Promise.all([getCurrentUser(), db.listing.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } }, category: true, owner: { select: { id: true, name: true, city: true, _count: { select: { listings: { where: { status: "PUBLISHED" } } } } } } } })]);
  if (!l || (l.status !== "PUBLISHED" && me?.id !== l.ownerId && me?.role !== "ADMIN")) notFound();
  const fav = me ? !!(await db.favorite.findUnique({ where: { userId_listingId: { userId: me.id, listingId: l.id } } })) : false;
  return (
    <article>
      <h1>{l.title}</h1>
      {l.status !== "PUBLISHED" && <p className="hb-error">Status: {l.status}{l.removedReason ? ` — ${l.removedReason}` : ""}</p>}
      <div className="hb-grid">{/* eslint-disable-next-line @next/next/no-img-element */}
        {l.images.map((i) => <img key={i.id} src={`/api/media/${i.storageKey}`} alt={l.title} className="hb-ph" />)}</div>
      <p><strong>{formatAzn(l.priceCents)}</strong> · {l.category.name} · {l.city}</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{l.description}</p>
      <p>Satıcı: {l.owner.name} ({l.owner._count.listings} dərc olunmuş elan)</p>
      {me && me.id !== l.ownerId && <><FavoriteButton listingId={l.id} initial={fav} /> <ReportButton listingId={l.id} /></>}
      {!me && <p>Seçilmişlərə əlavə etmək üçün daxil olun.</p>}
    </article>
  );
}
