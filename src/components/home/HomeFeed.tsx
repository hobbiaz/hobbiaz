"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CATEGORY_CHIPS, TREND_STORES } from "@/data/content";
import { useUI } from "@/providers/UIProvider";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { IconFilter, IconStoreCta, IconVerified, IconVerifiedAlt } from "@/components/icons";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types";
import { pressable } from "@/lib/a11y";

/** Two rows of the widest (5-column) grid. */
const FIRST_ROWS_COUNT = 10;

function ProductGrid({ id, items }: { id: string; items: Product[] }) {
  return (
    <div className="product-grid-masonry" id={id}>
      {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
}

export function HomeFeed() {
  const { products, category, filterCategory, resetCategory, openModal, openAuth, query, user, backend, hasMore, loadMore, feedLoading } = useUI();
  const hasStore = Boolean(user?.store);
  const showAll = category === "all" && !query;
  const showEverything = () => {
    resetCategory();
    document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // The first rows sit above "Trend Mağazalar"; everything after (including pages loaded while
  // scrolling) goes to "Yeni Məhsullar", so already-visible cards never jump between the grids.
  const half = Math.min(FIRST_ROWS_COUNT, Math.ceil(products.length / 2));

  // Infinite scroll: when the end of the list comes near, fetch the next page automatically.
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMoreRef.current();
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, products.length]);

  return (
    <div className="page active" id="page-home">
      <div className="filter-row" id="chip-row" style={{ paddingTop: ".85rem" }}>
        <button className="filter-btn-chip" id="filter-open-btn" onClick={() => openModal("filter")}>
          <IconFilter />
          Filtrlər
        </button>
        {CATEGORY_CHIPS.map((c) => (
          <span key={c.slug} {...pressable} className={`chip${category === c.slug ? " active" : ""}`} data-cat={c.slug} onClick={() => filterCategory(c.slug)}>
            {c.label}
          </span>
        ))}
      </div>

      <div className="section" style={{ paddingTop: ".35rem" }}>
        {query && (
          <div className="section-header">
            <h2>“{query}” üçün {products.length} nəticə</h2>
            <Link href="/" onClick={() => resetCategory()}>Təmizlə</Link>
          </div>
        )}
        {backend === "offline" && (
          <p style={{ fontSize: ".78rem", color: "var(--outline)", margin: "0 0 .5rem" }}>Demo rejim: server/baza qoşulmayıb, nümunə məhsullar göstərilir.</p>
        )}
        {products.length === 0 && (feedLoading || backend === "checking") ? (
          <p style={{ color: "var(--outline)", padding: "2rem", textAlign: "center" }}>Yüklənir…</p>
        ) : products.length === 0 ? (
          <div className="product-grid-masonry" id="products-grid">
            <p style={{ color: "var(--outline)", padding: "2rem", textAlign: "center", columns: "initial" }}>
              {query ? "Heç nə tapılmadı. Başqa söz yoxlayın." : "Bu kateqoriyada məhsul tapılmadı."}
            </p>
          </div>
        ) : (
          // The unfiltered feed is split around "Trend Mağazalar"; a filtered list shows in full
          // (the original hid the second half while filtering, so half the matches were lost).
          <ProductGrid id="products-grid" items={showAll ? products.slice(0, half) : products} />
        )}
      </div>

      {showAll && (
        <div className="section fade-up" id="trend-stores-section">
          <div className="section-header"><h2>Trend Mağazalar</h2><Link href="/search">Hamısına bax</Link></div>
          <div className="stores-list">
            {TREND_STORES.map((s, i) => (
              <div className="store-row" key={s.name}>
                <ImageWithFallback
                  className="store-avatar-img"
                  src={s.avatar}
                  alt={s.name.split(" ")[0]}
                  fallback={<div className="store-avatar-placeholder" style={s.gradient ? { background: s.gradient } : undefined}>{s.initial}</div>}
                />
                <div className="store-info">
                  <div className="store-name">
                    {s.name}
                    {i === 0 ? <IconVerified /> : <IconVerifiedAlt />}
                  </div>
                  <div className="store-meta"><span className="founder-tag">FOUNDER</span><div className="store-rating">⭐ {s.rating}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Second half of the feed; hidden while a category filter is active. */}
      <div className="section fade-up" style={showAll ? undefined : { display: "none" }}>
        <div className="section-header"><h2>Yeni Məhsullar</h2><Link href="/" scroll={false} onClick={showEverything}>Hamısına bax</Link></div>
        <ProductGrid id="products-grid-2" items={showAll ? products.slice(half) : []} />
      </div>

      {hasMore && (
        <div ref={sentinel} style={{ display: "flex", justifyContent: "center", margin: "0 0 1.5rem" }}>
          <button className="store-cta-btn" onClick={loadMore} disabled={feedLoading}>{feedLoading ? "Yüklənir…" : "Daha çox məhsul"}</button>
        </div>
      )}

      <div className="store-cta-banner fade-up">
        <div className="store-cta-left">
          <div className="store-cta-icon" style={{ background: "transparent", width: 48, height: 48 }}>
            <IconStoreCta />
          </div>
          <div>
            <div className="store-cta-title">{hasStore ? "Yeni məhsulun var?" : "Yaradıcılığını gəlirə çevir!"}</div>
            <div className="store-cta-sub">{hasStore ? "Şəkil çək, qiymət yaz: 2 dəqiqəyə elan hazırdır." : "Cəmi 2 dəqiqəyə öz onlayn mağazanı yarat və satışa başla."}</div>
          </div>
        </div>
        <button className="store-cta-btn" onClick={() => (hasStore ? openModal("listing") : openAuth("register"))}>{hasStore ? "Elan yerləşdir" : "Mağaza Aç"}</button>
      </div>
    </div>
  );
}
