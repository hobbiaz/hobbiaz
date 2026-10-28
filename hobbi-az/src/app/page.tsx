import Link from "next/link";
import { db } from "@/lib/db";
import { buildListingQuery, PAGE_SIZE } from "@/lib/listing-query";
import { formatAzn } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { where, orderBy, skip, take, filters } = buildListingQuery(sp);
  const [items, total, categories] = await Promise.all([
    db.listing.findMany({ where, orderBy, skip, take, include: { images: { take: 1, orderBy: { position: "asc" } }, category: true, owner: { select: { name: true } } } }),
    db.listing.count({ where }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (page: number) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== "" && k !== "page") p.set(k, String(v)); p.set("page", String(page)); return `/?${p}`; };

  return (<>
    <form className="hb-filters" role="search" action="/">
      <input name="q" defaultValue={filters.q} placeholder="Axtar…" aria-label="Axtarış" />
      <select name="category" defaultValue={filters.category ?? ""} aria-label="Kateqoriya">
        <option value="">Bütün kateqoriyalar</option>
        {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>
      <input name="min" type="number" min="0" defaultValue={filters.min} placeholder="Min ₼" aria-label="Minimum qiymət" />
      <input name="max" type="number" min="0" defaultValue={filters.max} placeholder="Max ₼" aria-label="Maksimum qiymət" />
      <select name="sort" defaultValue={filters.sort} aria-label="Sıralama">
        <option value="new">Ən yenilər</option><option value="price_asc">Qiymət: aşağıdan yuxarı</option><option value="price_desc">Qiymət: yuxarıdan aşağı</option>
      </select>
      <button className="hb-btn" type="submit">Tətbiq et</button>
    </form>
    {items.length === 0 ? <p>Heç bir elan tapılmadı.</p> : (
      <div className="hb-grid">
        {items.map((l) => (
          <Link key={l.id} href={`/listings/${l.id}`} className="hb-card">
            {l.images[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/media/${l.images[0].storageKey}`} alt={l.title} /> : <div className="hb-ph" aria-hidden />}
            <div><strong>{l.title}</strong><br />{formatAzn(l.priceCents)}<br /><small>{l.category.name} · {l.city} · {l.owner.name}</small></div>
          </Link>
        ))}
      </div>)}
    <div className="hb-pager">
      {filters.page > 1 && <Link href={qs(filters.page - 1)}>← Əvvəlki</Link>}
      <span>{filters.page} / {pages}</span>
      {filters.page < pages && <Link href={qs(filters.page + 1)}>Növbəti →</Link>}
    </div>
  </>);
}
