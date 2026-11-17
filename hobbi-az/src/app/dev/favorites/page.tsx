import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatAzn } from "@/lib/format";
export const dynamic = "force-dynamic";
export default async function Favorites() {
  const me = await getCurrentUser();
  if (!me) redirect("/dev/login");
  const favs = await db.favorite.findMany({ where: { userId: me.id, listing: { status: "PUBLISHED" } }, include: { listing: true }, orderBy: { createdAt: "desc" } });
  return (<><h1>Seçilmişlər</h1>{favs.length === 0 ? <p>Hələ heç nə seçməmisiniz.</p> :
    <div className="hb-grid">{favs.map(({ listing: l }) => <Link key={l.id} className="hb-card" href={`/dev/listings/${l.id}`}><div><strong>{l.title}</strong><br />{formatAzn(l.priceCents)}</div></Link>)}</div>}</>);
}
