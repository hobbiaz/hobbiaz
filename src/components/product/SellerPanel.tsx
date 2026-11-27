"use client";

import { useEffect, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { IconSellerBack } from "@/components/icons";
import { pressable } from "@/lib/a11y";
import { api } from "@/lib/api-client";
import { useUI } from "@/providers/UIProvider";
import type { Product } from "@/types";

export interface SellerRef {
  name: string;
  avatar: string;
  /** Store slug: when present the real store is loaded from the API. */
  slug?: string;
}

interface StoreInfo {
  name: string;
  region: string;
  avatarUrl: string | null;
  bio: string | null;
  rating: number | null;
  reviewCount: number;
  listings: Product[];
}

/** Slide-in seller profile with their listings. */
export function SellerPanel({ seller, onClose, onOpenProduct }: { seller: SellerRef | null; onClose: () => void; onOpenProduct: (id: string) => void }) {
  const { rememberProducts } = useUI();
  const [store, setStore] = useState<StoreInfo | null>(null);

  useEffect(() => {
    setStore(null);
    if (!seller?.slug) return;
    let cancelled = false;
    api<StoreInfo>(`/api/stores/${encodeURIComponent(seller.slug)}`)
      .then((s) => { if (!cancelled) { setStore(s); rememberProducts(s.listings); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [seller?.slug, rememberProducts]);

  // Demo sellers (no slug) show the matching demo products.
  const items = store ? store.listings : seller && !seller.slug ? PRODUCTS.filter((p) => p.shop === seller.name).slice(0, 6) : [];
  const avatar = store?.avatarUrl ?? seller?.avatar;
  const meta = store
    ? [store.region, store.rating ? `Reytinq: ${store.rating} ★ (${store.reviewCount})` : "Yeni mağaza"].join(" • ")
    : seller ? "hobbi.az satıcısı" : "";

  return (
    <div id="pd-seller-panel" className={seller ? "open" : undefined}>
      <div className="pd-seller-banner" id="pd-seller-banner">
        <button className="pd-seller-back" onClick={onClose} aria-label="Geri">
          <IconSellerBack />
        </button>
      </div>
      <div className="pd-seller-header">
        <div className="pd-seller-avatar-wrap">
          <div className="pd-seller-avatar">
            {avatar ? <img id="pd-seller-avatar-img" src={avatar} alt={seller?.name ?? ""} /> : <div className="pd-avatar-fallback">{seller?.name[0]}</div>}
          </div>
        </div>
        <div className="pd-seller-name" id="pd-seller-name">{store?.name ?? seller?.name}</div>
        <div className="pd-seller-meta" id="pd-seller-meta">{meta}</div>
        {store?.bio && <p style={{ textAlign: "center", color: "var(--on-surface-var)", fontSize: ".88rem", margin: ".5rem 1rem 0" }}>{store.bio}</p>}
      </div>
      <div className="pd-seller-products">
        <div className="pd-seller-products-title">Elanları {store ? `(${store.listings.length})` : ""}</div>
        <div className="pd-seller-grid" id="pd-seller-grid">
          {seller && items.length === 0 && <p style={{ color: "var(--outline)", fontSize: ".9rem" }}>{seller.slug && !store ? "Yüklənir…" : "Hələ elan yoxdur."}</p>}
          {seller &&
            items.map((sp) => (
              <div key={sp.id} {...pressable} className="pd-seller-card" onClick={() => onOpenProduct(sp.id)}>
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
