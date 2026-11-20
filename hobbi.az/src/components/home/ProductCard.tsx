"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { useUI } from "@/providers/UIProvider";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { IconCart, IconHeartFilled, IconHeartOutline } from "@/components/icons";

export function ProductCard({ product: p, index }: { product: Product; index: number }) {
  const { openProduct, toast } = useUI();
  // The prototype pre-liked a few cards to show the filled-heart state.
  const [liked, setLiked] = useState(p.liked ?? (index === 0 || index === 3 || index === 4));

  return (
    <article className="card product-card fade-up" style={{ animationDelay: `${index * 0.05}s` }} onClick={() => openProduct(p.id)}>
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
            setLiked((v) => !v);
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
