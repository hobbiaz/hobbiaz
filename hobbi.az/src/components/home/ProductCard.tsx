"use client";

import type { Product } from "@/types";
import { useUI } from "@/providers/UIProvider";
import { useProductActions } from "@/hooks/useProductActions";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { IconCart, IconHeartFilled, IconHeartOutline } from "@/components/icons";

export function ProductCard({ product: p, index }: { product: Product; index: number }) {
  const { openProduct, isFavorite, toggleFavorite } = useUI();
  const { order, interested } = useProductActions();
  const liked = isFavorite(p.id);

  return (
    <article
      className="card product-card fade-up"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => openProduct(p.id)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openProduct(p.id); }
      }}
      tabIndex={0}
      aria-label={`${p.title}, ${p.price} ₼`}
    >
      <div className="card-image-wrapper product-img-wrap">
        <ImageWithFallback
          className="card-image pimg pimg-photo"
          src={p.photo}
          alt={p.title}
          fallback={
            <div className="pimg card-image-fallback" style={{ background: p.color, display: "flex", borderRadius: 16 }} aria-hidden="true">
              {p.emoji}
            </div>
          }
        />
        <button
          type="button"
          className={`wishlist-btn${liked ? " is-active" : ""}`}
          aria-label={liked ? "İstək siyahısından çıxart" : "İstək siyahısına əlavə et"}
          aria-pressed={liked}
          data-liked={liked}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(p.id);
          }}
        >
          <IconHeartOutline className="heart-outline" />
          <IconHeartFilled className="heart-filled" />
        </button>
      </div>
      <h3 className="card-title product-title">{p.title}</h3>
      <div className="card-price-row product-footer">
        <div className="card-prices">
          <span className="price-current product-price">{p.price} ₼</span>
          {p.oldPrice && <span className="price-old">{p.oldPrice} ₼</span>}
        </div>
        <button
          type="button"
          className="cart-icon"
          aria-label="Sifariş et"
          title="Sifariş et"
          onClick={(e) => {
            e.stopPropagation();
            void order(p);
          }}
        >
          <IconCart />
        </button>
        <button
          type="button"
          className="btn-interest"
          onClick={(e) => {
            e.stopPropagation();
            void interested(p);
          }}
        >
          Maraqlan
        </button>
      </div>
    </article>
  );
}
