"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { api, ApiError } from "@/lib/api-client";
import { useUI } from "@/providers/UIProvider";
import type { Product } from "@/types";

const MIN = 8;
const MAX = 20;

interface ListingsPage { items: Product[]; hasMore: boolean }

/**
 * /collections/new — every product on the site with a tick box on each card.
 * 8–20 picks + a name enable "Kolleksiyanı Paylaş"; the collection then shows up for everyone
 * in "Sizin üçün seçilmiş kolleksiyalar".
 */
export function CollectionBuilder() {
  const { backend, user, openAuth, toast } = useUI();
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const loadNext = useCallback(() => {
    if (loading || !hasMore || backend !== "online") return;
    setLoading(true);
    api<ListingsPage>(`/api/listings?page=${page + 1}`)
      .then((r) => {
        setItems((list) => [...list, ...r.items.filter((p) => !list.some((x) => x.id === p.id))]);
        setHasMore(r.hasMore);
        setPage((n) => n + 1);
      })
      .catch((e) => toast(e instanceof Error ? e.message : "Məhsulları yükləmək alınmadı"))
      .finally(() => setLoading(false));
  }, [loading, hasMore, backend, page, toast]);

  useEffect(() => { if (backend === "online" && page === 0) loadNext(); }, [backend, page, loadNext]);

  // Load the next page when the end of the grid comes near.
  const sentinel = useRef<HTMLDivElement>(null);
  const loadRef = useRef(loadNext);
  loadRef.current = loadNext;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) loadRef.current(); }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, items.length]);

  const toggle = (id: string) => {
    setSelected((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= MAX) { toast(`Ən çox ${MAX} məhsul seçmək olar`); return s; }
      return [...s, id];
    });
  };

  const count = selected.length;
  const canShare = count >= MIN && count <= MAX && title.trim().length >= 2 && !saving;
  const hint = count < MIN
    ? `Daha ${MIN - count} məhsul seçin (ən azı ${MIN})`
    : title.trim().length < 2 ? "Kolleksiyaya ad verin" : "Hazırdır!";

  const share = async () => {
    if (!canShare) return;
    setSaving(true);
    try {
      const r = await api<{ id: string }>("/api/collections", { method: "POST", body: { title: title.trim(), listingIds: selected } });
      router.push(`/collections/${r.id}?created=1`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Kolleksiyanı yaratmaq alınmadı");
      setSaving(false);
    }
  };

  if (backend === "offline") {
    return <div className="page active"><p className="collection-empty">Demo rejim: kolleksiya yaratmaq üçün server qoşulmalıdır.</p></div>;
  }
  if (backend === "online" && !user) {
    return (
      <div className="page active">
        <div className="collection-empty">
          <p>Kolleksiya yaratmaq üçün hesabınıza daxil olun.</p>
          <button type="button" className="store-cta-btn" onClick={() => openAuth("login")}>Daxil ol</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page active" id="page-collection-new">
      <div className="section collection-page">
        <div className="collection-head">
          <div>
            <h1 className="collection-title">Kolleksiya yarat</h1>
            <div className="collection-meta">Kartların üstündəki xanaya toxunaraq {MIN}–{MAX} məhsul seçin.</div>
          </div>
        </div>

        <div className="product-grid-masonry">
          {items.map((p) => {
            const on = selected.includes(p.id);
            const full = !on && count >= MAX;
            return (
              <article
                key={p.id}
                className={`card product-card pick-card${on ? " is-picked" : ""}${full ? " is-full" : ""}`}
                role="checkbox"
                aria-checked={on}
                aria-label={p.title}
                tabIndex={0}
                onClick={() => toggle(p.id)}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(p.id); } }}
              >
                <div className="card-image-wrapper product-img-wrap">
                  <ImageWithFallback
                    className="card-image pimg pimg-photo"
                    src={p.photo}
                    alt={p.title}
                    fallback={<div className="pimg card-image-fallback" style={{ background: p.color, display: "flex", borderRadius: 16 }} aria-hidden="true">{p.emoji}</div>}
                  />
                  <span className="pick-box" aria-hidden="true">{on ? selected.indexOf(p.id) + 1 : ""}</span>
                </div>
                <h3 className="card-title product-title">{p.title}</h3>
                <div className="card-price-row product-footer">
                  <span className="price-current product-price">{p.price} ₼</span>
                  <span className="pick-shop">{p.shop}</span>
                </div>
              </article>
            );
          })}
        </div>
        <div ref={sentinel} className="collection-empty" style={{ padding: "1rem" }}>
          {loading ? "Yüklənir…" : !hasMore && items.length > 0 ? "Bütün məhsullar göstərildi" : ""}
        </div>
      </div>

      <div className="pick-bar" role="region" aria-label="Kolleksiya">
        <div className="pick-bar-inner">
          <div className="pick-count"><div><strong>{count}</strong> / {MAX} seçildi</div><span>{hint}</span></div>
          <input
            className="pick-title"
            type="text"
            placeholder="Kolleksiyanın adı"
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Kolleksiyanın adı"
          />
          <button type="button" className="pick-share" disabled={!canShare} onClick={share}>
            {saving ? "Paylaşılır…" : "Kolleksiyanı Paylaş"}
          </button>
        </div>
      </div>
    </div>
  );
}
