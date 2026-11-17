"use client";

import { PRODUCTS } from "@/data/products";
import { IconSellerBack } from "@/components/icons";

export interface SellerRef {
  name: string;
  avatar: string;
}

/** Slide-in seller profile with up to six of their listings. */
export function SellerPanel({ seller, onClose, onOpenProduct }: { seller: SellerRef | null; onClose: () => void; onOpenProduct: (id: number) => void }) {
  const own = seller ? PRODUCTS.filter((p) => p.shop === seller.name).slice(0, 6) : [];
  const items = own.length ? own : PRODUCTS.slice(0, 4);

  return (
    <div id="pd-seller-panel" className={seller ? "open" : undefined}>
      <div className="pd-seller-banner" id="pd-seller-banner">
        <button className="pd-seller-back" onClick={onClose} aria-label="Geri">
          <IconSellerBack />
        </button>
      </div>
      <div className="pd-seller-header">
        <div className="pd-seller-avatar-wrap">
          <div className="pd-seller-avatar">{seller?.avatar && <img id="pd-seller-avatar-img" src={seller.avatar} alt={seller.name} />}</div>
        </div>
        <div className="pd-seller-name" id="pd-seller-name">{seller?.name}</div>
        <div className="pd-seller-meta" id="pd-seller-meta">{seller && "Hobbi.az satıcısı • Reytinq: 4.9 ★"}</div>
      </div>
      <div className="pd-seller-products">
        <div className="pd-seller-products-title">Elanları</div>
        <div className="pd-seller-grid" id="pd-seller-grid">
          {seller &&
            items.map((sp) => (
              <div className="pd-seller-card" key={sp.id} onClick={() => onOpenProduct(sp.id)}>
                <img src={sp.images[0] || sp.photo} alt={sp.title} loading="lazy" />
                <div className="pd-seller-card-info">
                  <div className="pd-seller-card-title">{sp.title}</div>
                  <div className="pd-seller-card-price">{sp.price} AZN</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
