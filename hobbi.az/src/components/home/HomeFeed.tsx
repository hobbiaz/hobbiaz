"use client";

import { CATEGORY_CHIPS, TREND_STORES } from "@/data/content";
import { useUI } from "@/providers/UIProvider";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { IconFilter, IconStoreCta, IconVerified, IconVerifiedAlt } from "@/components/icons";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types";

function ProductGrid({ id, items }: { id: string; items: Product[] }) {
  return (
    <div className="product-grid-masonry" id={id}>
      {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
}

export function HomeFeed() {
  const { products, category, filterCategory, openModal } = useUI();
  const showAll = category === "all";
  const half = Math.ceil(products.length / 2);

  return (
    <div className="page active" id="page-home">
      <div className="filter-row" id="chip-row" style={{ paddingTop: ".85rem" }}>
        <button className="filter-btn-chip" id="filter-open-btn" onClick={() => openModal("filter")}>
          <IconFilter />
          Filtrlər
        </button>
        {CATEGORY_CHIPS.map((c) => (
          <span key={c.slug} className={`chip${category === c.slug ? " active" : ""}`} data-cat={c.slug} onClick={() => filterCategory(c.slug)}>
            {c.label}
          </span>
        ))}
      </div>

      <div className="section" style={{ paddingTop: ".35rem" }}>
        {products.length === 0 ? (
          <div className="product-grid-masonry" id="products-grid">
            <p style={{ color: "var(--outline)", padding: "2rem", textAlign: "center", columns: "initial" }}>
              Bu kateqoriyada məhsul tapılmadı.
            </p>
          </div>
        ) : (
          <ProductGrid id="products-grid" items={products.slice(0, half)} />
        )}
      </div>

      {showAll && (
        <div className="section fade-up" id="trend-stores-section">
          <div className="section-header"><h2>Trend Mağazalar</h2><a href="#">Hamısına bax</a></div>
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
        <div className="section-header"><h2>Yeni Məhsullar</h2><a href="#">Hamısına bax</a></div>
        <ProductGrid id="products-grid-2" items={products.length ? products.slice(half) : []} />
      </div>

      <div className="store-cta-banner fade-up">
        <div className="store-cta-left">
          <div className="store-cta-icon" style={{ background: "transparent", width: 48, height: 48 }}>
            <IconStoreCta />
          </div>
          <div>
            <div className="store-cta-title">Yaradıcılığını gəlirə çevir!</div>
            <div className="store-cta-sub">Cəmi 2 dəqiqəyə öz onlayn mağazanı yarat və satışa başla.</div>
          </div>
        </div>
        <button className="store-cta-btn" onClick={() => openModal("auth")}>Mağaza Aç</button>
      </div>
    </div>
  );
}
