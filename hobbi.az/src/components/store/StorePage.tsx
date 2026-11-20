"use client";

import { useEffect } from "react";
import { ProductCard } from "@/components/home/ProductCard";
import { useUI } from "@/providers/UIProvider";
import type { Product } from "@/types";

interface Props {
  store: { name: string; region: string; avatarUrl: string | null; bio: string | null; instagram: string | null; tiktok: string | null; since: string };
  products: Product[];
  rating: number | null;
  reviewCount: number;
}

export function StorePage({ store, products, rating, reviewCount }: Props) {
  const { rememberProducts } = useUI();
  useEffect(() => { rememberProducts(products); }, [products, rememberProducts]);
  const since = new Date(store.since).toLocaleDateString("az-AZ", { year: "numeric", month: "long" });

  return (
    <div className="page active" id="page-store">
      <div className="profile-page">
        <div className="profile-banner" style={{ background: "linear-gradient(135deg,#e76262 0%,#F06328 60%,#FCBC05 100%)", minHeight: "110px" }} />
        <div className="profile-header">
          <div className="profile-avatar-wrap" style={{ marginTop: "-36px", marginBottom: ".5rem" }}>
            {store.avatarUrl
              ? <img src={store.avatarUrl} alt={store.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid white" }} />
              : <div className="profile-avatar-placeholder" style={{ background: "#e76262", width: "72px", height: "72px", fontSize: "1.4rem", border: "3px solid white" }}>{store.name[0]?.toUpperCase()}</div>}
          </div>
          <h1 className="profile-name" style={{ fontWeight: 700, fontSize: "1.4rem", color: "var(--on-surface)" }}>{store.name}</h1>
          <div className="profile-location" style={{ fontSize: ".83rem", color: "#8c7071", margin: ".2rem 0 .4rem" }}>
            📍 {store.region} · {since}-dən · {rating ? `⭐ ${rating} (${reviewCount} rəy)` : "Yeni mağaza"}
          </div>
          {store.bio && <p className="profile-bio" style={{ fontSize: ".88rem", color: "#584142", marginBottom: ".6rem" }}>{store.bio}</p>}
          <div style={{ display: "flex", gap: ".75rem", fontSize: ".85rem", marginBottom: "1rem" }}>
            {store.instagram && <a href={store.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
            {store.tiktok && <a href={store.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>}
          </div>
        </div>
        <div className="section">
          <div className="section-header"><h2>Məhsullar ({products.length})</h2></div>
          {products.length === 0
            ? <p style={{ color: "var(--outline)", textAlign: "center", padding: "2rem" }}>Bu mağazada hələ məhsul yoxdur.</p>
            : <div className="product-grid-masonry">{products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>}
        </div>
      </div>
    </div>
  );
}
