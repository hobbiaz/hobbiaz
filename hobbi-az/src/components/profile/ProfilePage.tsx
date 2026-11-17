"use client";

import { useState } from "react";
import Link from "next/link";
import { PROFILE_PRODUCTS } from "@/data/ideas";
import { useUI } from "@/providers/UIProvider";
import { IconAddAccount, IconProfileSettings } from "@/components/icons";

type Tab = "products" | "favorites" | "history";

export function ProfilePage() {
  const { toast, openModal } = useUI();
  const [tab, setTab] = useState<Tab>("products");
  const tabClass = (t: Tab) => `tab${tab === t ? " active" : ""}`;
  const panelClass = (t: Tab) => `tab-panel${tab === t ? " active" : ""}`;

  return (
      <div className="page active" id="page-profile">
        <div className="profile-page">
          {/* Teal gradient banner */}
          <div className="profile-banner" style={{ position: "relative", background: "linear-gradient(135deg,#006B58 0%,#00897B 50%,#1ABC9C 100%)", minHeight: "120px" }}>
            <div style={{ position: "absolute", top: ".8rem", right: "1.25rem", display: "flex", gap: ".5rem", zIndex: "5" }}>
              <button style={{ width: "auto", height: "38px", borderRadius: "19px", background: "rgba(255,255,255,.18)", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: ".35rem", padding: "0 .85rem", fontSize: ".78rem", fontWeight: "600", color: "white", fontFamily: "'Roboto',sans-serif" }} onClick={() => toast("Hesab əlavə et funksiyası")}>
                <IconAddAccount />
                Hesab əlavə et
              </button>
              <Link href="/settings" aria-label="Parametrlər" style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconProfileSettings />
              </Link>
            </div>
          </div>
          <div className="profile-header">
            <div className="profile-avatar-wrap" style={{ marginTop: "-36px", marginBottom: ".5rem" }}>
              <div className="profile-avatar-placeholder" style={{ background: "#3E91C4", width: "72px", height: "72px", fontSize: "1.4rem", border: "3px solid white" }}>O</div>
              <span className="edit-btn" style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#fff", border: "1.5px solid #E7E8E9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", bottom: "0", right: "0", position: "absolute" }}>✎</span>
            </div>
            <div className="profile-name" style={{ fontWeight: "700", fontSize: "1.4rem", color: "#191c1d" }}>Orxan Məmmədov</div>
            <div className="profile-location" style={{ fontSize: ".83rem", color: "#8c7071", margin: ".2rem 0 .4rem" }}>📍 Bakı, Azərbaycan · Rəqəmsal illustrator</div>
            <div className="profile-bio" style={{ fontSize: ".88rem", color: "#584142", marginBottom: ".9rem" }}>Keramika həvəskarı. Hər bir əsər bir hekayə danışır. ✨</div>
            <div style={{ display: "flex", gap: ".55rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <button style={{ flex: "1", minWidth: "140px", height: "44px", background: "#2563EB", color: "#fff", border: "none", borderRadius: "11px", padding: "0 .9rem", fontFamily: "'Manrope','Roboto',sans-serif", fontWeight: "600", fontSize: ".85rem", cursor: "pointer" }} onClick={() => toast("Profil redaktə edilir")}>Düzəliş et</button>
              <button style={{ flex: "1", minWidth: "140px", height: "44px", background: "#fff", color: "#3E91C4", border: "1.5px solid #3E91C4", borderRadius: "11px", padding: "0 .9rem", fontFamily: "'Manrope','Roboto',sans-serif", fontWeight: "600", fontSize: ".85rem", cursor: "pointer" }} onClick={() => toast("Profil paylaşıldı")}>Profili paylaş</button>
            </div>
          </div>
          {/* Store CTA banner - styled like screenshot */}
          <div className="open-store-banner" style={{ margin: "0 .75rem 1rem", background: "#fff8f8", border: "1.5px dashed #dfbfbf", borderRadius: "16px", padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: ".85rem" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "#ffeef0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0", fontSize: "1.3rem" }}>🏪</div>
            <div className="open-store-text" style={{ flex: "1", minWidth: "0" }}>
              <h4 style={{ fontWeight: "700", fontSize: ".88rem", color: "#3E91C4", marginBottom: ".18rem" }}>Yaradıcılığını gəlirə çevir!</h4>
              <p style={{ fontSize: ".78rem", color: "#8c7071", lineHeight: "1.4" }}>Cəmi 2 dəqiqədə öz onlayn mağazanı yarat və satışa başla.</p>
            </div>
            <button style={{ background: "#3E91C4", color: "#fff", border: "none", borderRadius: "50px", padding: ".5rem .9rem", fontFamily: "'Manrope','Roboto',sans-serif", fontWeight: "600", fontSize: ".78rem", cursor: "pointer", flexShrink: "0", whiteSpace: "nowrap" }} onClick={() => openModal("auth")}>Mağaza Aç</button>
          </div>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon">👁</div><div className="stat-number">1,248</div><div className="stat-label">Baxış (bu ay)</div><div className="stat-change up">+12%</div></div>
            <div className="stat-card"><div className="stat-icon">🛒</div><div className="stat-number">42</div><div className="stat-label">Səbətə əlavələr</div><div className="stat-change up">+5</div></div>
            <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-number">4.9</div><div className="stat-label">Mağaza reytinqi</div><div className="stat-change new">Yeni</div></div>
          </div>
          <div className="tab-row">
            <span className={tabClass("products")} onClick={() => setTab("products")}>Məhsullarım</span>
            <span className={tabClass("favorites")} onClick={() => setTab("favorites")}>Sevimlilər</span>
            <span className={tabClass("history")} onClick={() => setTab("history")}>Tarixçə</span>
          </div>
          <div className={panelClass("products")} id="tab-products">
            <div className="products-list" id="profile-products">
              {PROFILE_PRODUCTS.map((p) => (
                <div className="product-list-card" key={p.title}>
                  <div style={{ width: "100%", aspectRatio: "16/7", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>{p.emoji}</div>
                  {p.badge && <span className="popular-tag">{p.badge}</span>}
                  <div className="product-list-overlay">
                    <span className="product-list-title">{p.title}</span>
                    <span className="product-list-price">{p.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={panelClass("favorites")} id="tab-favorites">
            <div className="tab-empty">
              <div className="tab-empty-icon">♡</div>
              <p>Hələ heç bir məhsulu sevimlilərinizə<br />əlavə etməmisiniz.</p>
            </div>
          </div>
          <div className={panelClass("history")} id="tab-history">
            <div className="tab-empty">
              <div className="tab-empty-icon">📦</div>
              <p>Alış-veriş tarixçəniz boş görünür.<br />İlk sifarişinizi verin!</p>
            </div>
          </div>
        </div>
      </div>
  );
}
