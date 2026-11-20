"use client";

import type { Product } from "@/types";
import { useUI } from "@/providers/UIProvider";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { IconCart, IconHeartFilled, IconHeartOutline } from "@/components/icons";

export function ProductCard({ product: p, index }: { product: Product; index: number }) {
  const { openProduct, toast, isFavorite, toggleFavorite } = useUI();
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
      aria-label={`${p.title}, ${p.price || "45"} ₼`}
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
          <span className="price-current product-price">{p.price || "45"} ₼</span>
          {p.oldPrice && <span className="price-old">{p.oldPrice} ₼</span>}
        </div>
        <button
          type="button"
          className="cart-icon"
          aria-label="Səbətə əlavə et"
          onClick={(e) => {
            e.stopPropagation();
            toast("Səbətə əlavə edildi 🛒");
          }}
        >
          <IconCart />
        </button>
        <button
          type="button"
          className="btn-interest"
          onClick={(e) => {
            e.stopPropagation();
            toast('Mesaj göndərildi! 💬 "Bu məhsul ilə maraqlanıram"');
          }}
        >
          Maraqlan
        </button>
      </div>
    </article>
  );
}
