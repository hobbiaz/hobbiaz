"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PROFILE_PRODUCTS } from "@/data/ideas";
import { useUI } from "@/providers/UIProvider";
import { IconAddAccount, IconProfileSettings } from "@/components/icons";
import { ProductCard } from "@/components/home/ProductCard";
import { pressable } from "@/lib/a11y";
import { api } from "@/lib/api-client";
import { copyText } from "@/lib/storage-client";
import type { Product } from "@/types";

type Tab = "products" | "favorites" | "orders";

interface Order {
  id: string;
  title: string;
  price: string;
  quantity: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  note: string | null;
  createdAt: string;
  listingId: string | null;
  image: string | null;
  store: string;
  buyer?: { name: string; email: string; phone: string | null };
}

const STATUS_LABEL: Record<Order["status"], string> = {
  PENDING: "Gözləyir", ACCEPTED: "Qəbul edildi", REJECTED: "Rədd edildi", COMPLETED: "Tamamlandı", CANCELLED: "Ləğv edildi",
};
const STATUS_COLOR: Record<Order["status"], string> = {
  PENDING: "#b7791f", ACCEPTED: "#2563EB", REJECTED: "#ba1a1a", COMPLETED: "#0DB0A0", CANCELLED: "#8c7071",
};
const LISTING_STATUS: Record<string, string> = { DRAFT: "Qaralama", PUBLISHED: "Dərc olunub", REMOVED: "Silinib" };

const btn = (primary: boolean): React.CSSProperties => ({
  height: "42px", background: primary ? "#2563EB" : "var(--profile-btn-bg, #fff)", color: primary ? "#fff" : "#3E91C4",
  border: primary ? "none" : "1.5px solid #3E91C4", borderRadius: "11px", padding: "0 1.4rem",
  fontFamily: "'Manrope','Roboto',sans-serif", fontWeight: "600", fontSize: ".85rem", cursor: "pointer",
});
const smallBtn: React.CSSProperties = { border: "1px solid var(--outline-var)", background: "transparent", color: "var(--on-surface)", borderRadius: 8, padding: ".3rem .6rem", fontSize: ".75rem", cursor: "pointer" };

/** "Profil": the signed-in user's store, listings, favourites and orders. */
export function ProfilePage() {
  const { backend, user, openAuth, openModal, toast, refreshUser, isFavorite, rememberProducts } = useUI();
  const [tab, setTab] = useState<Tab>("products");
  const [mine, setMine] = useState<Product[] | null>(null);
  const [favs, setFavs] = useState<Product[] | null>(null);
  const [sales, setSales] = useState<Order[] | null>(null);
  const [purchases, setPurchases] = useState<Order[] | null>(null);
  const isSeller = Boolean(user?.store);
  const tabClass = (t: Tab) => `tab${tab === t ? " active" : ""}`;
  const panelClass = (t: Tab) => `tab-panel${tab === t ? " active" : ""}`;

  const load = useCallback(() => {
    if (!user) return;
    if (user.store) api<{ items: Product[] }>("/api/listings?owner=me").then((r) => { setMine(r.items); rememberProducts(r.items); }).catch(() => setMine([]));
    if (user.store) api<Order[]>("/api/orders?role=seller").then(setSales).catch(() => setSales([]));
    api<Order[]>("/api/orders").then(setPurchases).catch(() => setPurchases([]));
  }, [user, rememberProducts]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    window.addEventListener("hobbi:listings-changed", load);
    return () => window.removeEventListener("hobbi:listings-changed", load);
  }, [load]);
  // Favourites reload when the heart is toggled anywhere.
  useEffect(() => {
    if (!user || tab !== "favorites") return;
    api<Product[]>("/api/favorites").then((list) => { setFavs(list); rememberProducts(list); }).catch(() => setFavs([]));
  }, [user, tab, isFavorite, rememberProducts]);

  if (backend === "offline") return <DemoProfile />;
  if (backend === "checking") return <div className="page active" id="page-profile"><p style={{ padding: "3rem", textAlign: "center", color: "var(--outline)" }}>Yüklənir…</p></div>;
  if (!user) {
    return (
      <div className="page active" id="page-profile">
        <div style={{ padding: "4rem 1.5rem", textAlign: "center", maxWidth: 420, margin: "0 auto" }}>
          <div style={{ fontSize: "2.5rem" }} aria-hidden="true">👤</div>
          <h2 style={{ margin: "1rem 0 .5rem" }}>Profilinizə daxil olun</h2>
          <p style={{ color: "var(--on-surface-var)", marginBottom: "1.5rem" }}>Sevimlilər, sifarişlər və mağazanız burada görünəcək.</p>
          <div className="profile-actions" style={{ display: "flex", gap: ".55rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button style={btn(true)} onClick={() => openAuth("login")}>Daxil ol</button>
            <button style={btn(false)} onClick={() => openAuth("register")}>Mağaza aç</button>
          </div>
        </div>
      </div>
    );
  }

  const store = user.store;
  const name = store?.name ?? user.name;
  const avatar = store?.avatarUrl ?? user.avatarUrl;
  const published = mine?.filter((p) => p.status === "PUBLISHED").length ?? 0;
  const pendingSales = sales?.filter((o) => o.status === "PENDING").length ?? 0;
  const orders = isSeller ? sales : purchases;

  const share = () => {
    if (!store) return;
    const url = `${window.location.origin}/s/${store.slug}`;
    if (navigator.share) navigator.share({ title: store.name, url }).catch(() => {});
    else void copyText(url).then(() => toast("Mağaza linki kopyalandı ✅"));
  };
  const openStore = async () => {
    const storeName = window.prompt("Mağazanızın adı (marka adı, ən azı 4 simvol):", user.name);
    if (!storeName) return;
    try {
      await api("/api/store", { method: "POST", body: { name: storeName.trim(), categorySlug: "digər", region: user.city || "Bakı" } });
      await refreshUser();
      toast("Mağazanız açıldı 🎉 İndi elan yerləşdirə bilərsiniz");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xəta");
    }
  };
  const setListingStatus = async (p: Product, status: "PUBLISHED" | "DRAFT") => {
    try {
      await api(`/api/listings/${p.id}`, { method: "PATCH", body: { status } });
      toast(status === "PUBLISHED" ? "Dərc edildi ✅" : "Satışdan çıxarıldı");
      load();
    } catch (e) { toast(e instanceof Error ? e.message : "Xəta"); }
  };
  const removeListing = async (p: Product) => {
    if (!window.confirm(`"${p.title}" elanı silinsin? Bu geri qaytarılmır.`)) return;
    try {
      await api(`/api/listings/${p.id}`, { method: "DELETE" });
      toast("Elan silindi");
      load();
    } catch (e) { toast(e instanceof Error ? e.message : "Xəta"); }
  };
  const setOrderStatus = async (o: Order, status: Order["status"]) => {
    try {
      await api(`/api/orders/${o.id}`, { method: "PATCH", body: { status } });
      load();
    } catch (e) { toast(e instanceof Error ? e.message : "Xəta"); }
  };

  return (
    <div className="page active" id="page-profile">
      <div className="profile-page">
        <div className="profile-banner" style={{ position: "relative", background: "linear-gradient(135deg,#006B58 0%,#00897B 50%,#1ABC9C 100%)", minHeight: "120px" }}>
          <div style={{ position: "absolute", top: ".8rem", right: "1.25rem", display: "flex", gap: ".5rem", zIndex: "5" }}>
            {isSeller && (
              <button style={{ width: "auto", height: "38px", borderRadius: "19px", background: "rgba(255,255,255,.18)", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: ".35rem", padding: "0 .85rem", fontSize: ".78rem", fontWeight: "600", color: "white", fontFamily: "'Roboto',sans-serif" }} onClick={() => openModal("listing")}>
                <IconAddAccount />
                Yeni elan
              </button>
            )}
            <Link href="/settings" aria-label="Parametrlər" style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconProfileSettings />
            </Link>
          </div>
        </div>
        <div className="profile-header">
          <div className="profile-avatar-wrap" style={{ marginTop: "-36px", marginBottom: ".5rem" }}>
            {avatar
              ? <img src={avatar} alt={name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid white" }} />
              : <div className="profile-avatar-placeholder" style={{ background: "#3E91C4", width: "72px", height: "72px", fontSize: "1.4rem", border: "3px solid white" }}>{name[0]?.toUpperCase()}</div>}
          </div>
          <div className="profile-name" style={{ fontWeight: "700", fontSize: "1.4rem", color: "var(--on-surface)" }}>{name}</div>
          <div className="profile-location" style={{ fontSize: ".83rem", color: "var(--profile-muted, #8c7071)", margin: ".2rem 0 .4rem" }}>
            📍 {store?.region ?? user.city ?? "Azərbaycan"} · {isSeller ? "Satıcı" : "Alıcı"}{user.role === "ADMIN" ? " · Admin" : ""}
          </div>
          {(store?.bio ?? user.bio) && <div className="profile-bio" style={{ fontSize: ".88rem", color: "var(--profile-bio, #584142)", marginBottom: ".9rem" }}>{store?.bio ?? user.bio}</div>}
          <div className="profile-actions" style={{ display: "flex", gap: ".55rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <Link href="/settings" style={{ ...btn(true), display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>Düzəliş et</Link>
            {isSeller
              ? <button style={btn(false)} onClick={share}>Mağazanı paylaş</button>
              : <button style={btn(false)} onClick={openStore}>Mağaza aç</button>}
            {user.role === "ADMIN" && <Link href="/admin" style={{ ...btn(false), display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>Admin panel</Link>}
          </div>
        </div>

        {!isSeller && (
          <div className="open-store-banner" style={{ margin: "0 .75rem 1rem", background: "#fff8f8", border: "1.5px dashed #dfbfbf", borderRadius: "16px", padding: "1rem 1.1rem", display: "flex", alignItems: "center", gap: ".85rem" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "#ffeef0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0", fontSize: "1.3rem" }}>🏪</div>
            <div className="open-store-text" style={{ flex: "1", minWidth: "0" }}>
              <h4 style={{ fontWeight: "700", fontSize: ".88rem", color: "#3E91C4", marginBottom: ".18rem" }}>Yaradıcılığını gəlirə çevir!</h4>
              <p style={{ fontSize: ".78rem", color: "var(--profile-muted, #8c7071)", lineHeight: "1.4" }}>Cəmi 2 dəqiqədə öz onlayn mağazanı yarat və satışa başla.</p>
            </div>
            <button style={{ background: "#3E91C4", color: "#fff", border: "none", borderRadius: "50px", padding: ".5rem .9rem", fontFamily: "'Manrope','Roboto',sans-serif", fontWeight: "600", fontSize: ".78rem", cursor: "pointer", flexShrink: "0", whiteSpace: "nowrap" }} onClick={openStore}>Mağaza Aç</button>
          </div>
        )}

        {isSeller && (
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon">🧺</div><div className="stat-number">{published}</div><div className="stat-label">Aktiv elan</div></div>
            <div className="stat-card"><div className="stat-icon">🛒</div><div className="stat-number">{sales?.length ?? "–"}</div><div className="stat-label">Sifariş</div>{pendingSales > 0 && <div className="stat-change new">{pendingSales} yeni</div>}</div>
            <div className="stat-card"><div className="stat-icon">❤</div><div className="stat-number">{mine?.reduce((n, p) => n + (p.favoriteCount ?? 0), 0) ?? "–"}</div><div className="stat-label">Bəyənmə</div></div>
          </div>
        )}

        <div className="tab-row">
          {isSeller && <span {...pressable} className={tabClass("products")} onClick={() => setTab("products")}>Məhsullarım</span>}
          <span {...pressable} className={tabClass("favorites")} onClick={() => setTab("favorites")}>Sevimlilər</span>
          <span {...pressable} className={tabClass("orders")} onClick={() => setTab("orders")}>{isSeller ? "Gələn sifarişlər" : "Sifarişlərim"}</span>
        </div>

        {isSeller && (
          <div className={panelClass("products")} id="tab-products">
            {mine === null ? <p className="tab-empty">Yüklənir…</p> : mine.length === 0 ? (
              <div className="tab-empty">
                <div className="tab-empty-icon">🧺</div>
                <p>Hələ elanınız yoxdur.</p>
                <button style={{ ...btn(true), flex: "none", marginTop: "1rem" }} onClick={() => openModal("listing")}>İlk elanı yerləşdir</button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: ".75rem", padding: "0 .75rem" }}>
                {mine.map((p) => (
                  <div key={p.id} style={{ display: "flex", gap: ".75rem", alignItems: "center", border: "1px solid var(--outline-var)", borderRadius: 14, padding: ".6rem" }}>
                    {p.photo ? <img src={p.photo} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover" }} /> : <div style={{ width: 64, height: 64, borderRadius: 10, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>{p.emoji}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                      <div style={{ fontSize: ".8rem", color: "var(--outline)" }}>{p.price} ₼ · {LISTING_STATUS[p.status ?? "PUBLISHED"]} · ❤ {p.favoriteCount ?? 0}</div>
                    </div>
                    <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {p.status === "DRAFT"
                        ? <button style={smallBtn} onClick={() => setListingStatus(p, "PUBLISHED")}>Dərc et</button>
                        : <button style={smallBtn} onClick={() => setListingStatus(p, "DRAFT")}>Gizlət</button>}
                      <button style={{ ...smallBtn, color: "var(--danger-text, #ba1a1a)" }} onClick={() => removeListing(p)}>Sil</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={panelClass("favorites")} id="tab-favorites">
          {favs === null ? <p className="tab-empty">Yüklənir…</p> : favs.length === 0 ? (
            <div className="tab-empty">
              <div className="tab-empty-icon">♡</div>
              <p>Hələ heç bir məhsulu sevimlilərinizə<br />əlavə etməmisiniz.</p>
            </div>
          ) : (
            <div className="product-grid-masonry" style={{ padding: "0 .75rem" }}>
              {favs.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>

        <div className={panelClass("orders")} id="tab-orders">
          {orders === null ? <p className="tab-empty">Yüklənir…</p> : orders.length === 0 ? (
            <div className="tab-empty">
              <div className="tab-empty-icon">📦</div>
              <p>{isSeller ? "Hələ sifariş yoxdur." : <>Alış-veriş tarixçəniz boş görünür.<br />İlk sifarişinizi verin!</>}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: ".75rem", padding: "0 .75rem" }}>
              {orders.map((o) => (
                <div key={o.id} style={{ border: "1px solid var(--outline-var)", borderRadius: 14, padding: ".75rem", display: "flex", gap: ".75rem" }}>
                  {o.image && <img src={o.image} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover" }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem" }}>
                      <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{o.title}</strong>
                      <span style={{ color: STATUS_COLOR[o.status], fontSize: ".78rem", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{STATUS_LABEL[o.status]}</span>
                    </div>
                    <div style={{ fontSize: ".8rem", color: "var(--outline)" }}>
                      {o.price} ₼ × {o.quantity} · {new Date(o.createdAt).toLocaleDateString("az-AZ")}{!isSeller && ` · ${o.store}`}
                    </div>
                    {o.buyer && <div style={{ fontSize: ".8rem", marginTop: ".25rem" }}>👤 {o.buyer.name} · {o.buyer.phone ?? "–"} · <a href={`mailto:${o.buyer.email}`}>{o.buyer.email}</a></div>}
                    {o.note && <div style={{ fontSize: ".8rem", marginTop: ".25rem", color: "var(--on-surface-var)" }}>“{o.note}”</div>}
                    <div style={{ display: "flex", gap: ".35rem", marginTop: ".5rem", flexWrap: "wrap" }}>
                      {isSeller && o.status === "PENDING" && <>
                        <button style={{ ...smallBtn, background: "#2563EB", color: "#fff", border: 0 }} onClick={() => setOrderStatus(o, "ACCEPTED")}>Qəbul et</button>
                        <button style={smallBtn} onClick={() => setOrderStatus(o, "REJECTED")}>Rədd et</button>
                      </>}
                      {isSeller && o.status === "ACCEPTED" && <button style={smallBtn} onClick={() => setOrderStatus(o, "COMPLETED")}>Tamamlandı</button>}
                      {!isSeller && o.status === "PENDING" && <button style={smallBtn} onClick={() => setOrderStatus(o, "CANCELLED")}>Ləğv et</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isSeller && purchases && purchases.length > 0 && (
            <p style={{ textAlign: "center", fontSize: ".8rem", color: "var(--outline)", marginTop: "1rem" }}>Sizin öz alışlarınız: {purchases.length} sifariş</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Offline demo (no database): the prototype's static profile, clearly labelled. */
function DemoProfile() {
  const { toast } = useUI();
  const shareProfile = () => {
    const url = `${window.location.origin}/profile`;
    if (navigator.share) navigator.share({ title: "hobbi.az profil", url }).catch(() => {});
    else void copyText(url).then(() => toast("Profil linki kopyalandı ✅"));
  };
  return (
    <div className="page active" id="page-profile">
      <div className="profile-page">
        <div className="profile-banner" style={{ background: "linear-gradient(135deg,#006B58 0%,#00897B 50%,#1ABC9C 100%)", minHeight: "120px" }} />
        <div className="profile-header">
          <div className="profile-avatar-wrap" style={{ marginTop: "-36px", marginBottom: ".5rem" }}>
            <div className="profile-avatar-placeholder" style={{ background: "#3E91C4", width: "72px", height: "72px", fontSize: "1.4rem", border: "3px solid white" }}>D</div>
          </div>
          <div className="profile-name" style={{ fontWeight: "700", fontSize: "1.4rem" }}>Demo profil</div>
          <div className="profile-location" style={{ fontSize: ".83rem", color: "var(--profile-muted, #8c7071)", margin: ".2rem 0 .9rem" }}>Server qoşulmayıb: məlumatlar nümunədir</div>
          <div className="profile-actions" style={{ display: "flex", gap: ".55rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <Link href="/settings" style={{ ...btn(true), display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>Düzəliş et</Link>
            <button style={btn(false)} onClick={shareProfile}>Profili paylaş</button>
          </div>
        </div>
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
    </div>
  );
}
