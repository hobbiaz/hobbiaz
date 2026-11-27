"use client";

import { useCallback, useEffect, useState } from "react";
import { useUI } from "@/providers/UIProvider";
import { api, timeAgo } from "@/lib/api-client";
import type { Product } from "@/types";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  listing: { id: string; title: string; status: string };
  reporter: { id: string; name: string };
}
interface Stats { users: number; stores: number; published: number; removed: number; orders: number; openReports: number; newUsers: number; latest: Product[] }

const card: React.CSSProperties = { border: "1px solid var(--outline-var)", borderRadius: 14, padding: ".8rem", background: "var(--surface-card, transparent)" };
const small: React.CSSProperties = { border: "1px solid var(--outline-var)", background: "transparent", color: "var(--on-surface)", borderRadius: 8, padding: ".3rem .65rem", fontSize: ".78rem", cursor: "pointer" };

/** /admin — moderation for users with role ADMIN (the API enforces it, not this page). */
export function AdminPage() {
  const { user, backend, toast, openProduct } = useUI();
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);

  const load = useCallback(() => {
    api<Stats>("/api/admin/stats").then(setStats).catch((e) => toast(e instanceof Error ? e.message : "Xəta"));
    api<Report[]>("/api/admin/reports").then(setReports).catch(() => setReports([]));
  }, [toast]);
  useEffect(() => { if (user?.role === "ADMIN") load(); }, [user, load]);

  if (backend === "checking") return <p style={{ padding: "3rem", textAlign: "center" }}>Yüklənir…</p>;
  if (user?.role !== "ADMIN") {
    return <div className="page active" style={{ padding: "4rem 1.5rem", textAlign: "center" }}><h2>Giriş qadağandır</h2><p style={{ color: "var(--outline)" }}>Bu səhifə yalnız administratorlar üçündür.</p></div>;
  }

  const moderate = async (listingId: string, action: "remove" | "restore") => {
    const reason = action === "remove" ? window.prompt("Silinmə səbəbi (satıcı görəcək):", "Qaydalara uyğun deyil") : "";
    if (reason === null) return;
    try {
      await api(`/api/admin/listings/${listingId}`, { method: "PATCH", body: { action, reason: reason || undefined } });
      toast(action === "remove" ? "Elan silindi" : "Elan bərpa edildi");
      load();
    } catch (e) { toast(e instanceof Error ? e.message : "Xəta"); }
  };
  const dismiss = async (id: string) => {
    try {
      await api(`/api/admin/reports/${id}`, { method: "PATCH", body: { status: "DISMISSED" } });
      load();
    } catch (e) { toast(e instanceof Error ? e.message : "Xəta"); }
  };

  const tiles: [string, number | undefined][] = [
    ["İstifadəçi", stats?.users], ["Yeni (7 gün)", stats?.newUsers], ["Mağaza", stats?.stores], ["Aktiv elan", stats?.published],
    ["Silinmiş elan", stats?.removed], ["Sifariş", stats?.orders], ["Açıq şikayət", stats?.openReports],
  ];

  return (
    <div className="page active" id="page-admin" style={{ padding: "1rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Admin panel</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: ".6rem", marginBottom: "1.5rem" }}>
        {tiles.map(([label, n]) => (
          <div key={label} style={card}><div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{n ?? "–"}</div><div style={{ fontSize: ".78rem", color: "var(--outline)" }}>{label}</div></div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.1rem", margin: "0 0 .6rem" }}>Açıq şikayətlər</h2>
      <div style={{ display: "grid", gap: ".6rem", marginBottom: "1.5rem" }}>
        {reports?.length === 0 && <p style={{ color: "var(--outline)" }}>Açıq şikayət yoxdur 🎉</p>}
        {reports?.map((r) => (
          <div key={r.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", flexWrap: "wrap" }}>
              <button onClick={() => openProduct(r.listing.id)} style={{ background: "none", border: 0, padding: 0, fontWeight: 600, cursor: "pointer", color: "var(--primary)", textAlign: "left" }}>{r.listing.title}</button>
              <span style={{ fontSize: ".75rem", color: "var(--outline)" }}>{r.reporter.name} · {timeAgo(r.createdAt)}</span>
            </div>
            <div style={{ fontSize: ".85rem", margin: ".35rem 0 .6rem" }}>{r.reason}{r.details ? `: ${r.details}` : ""}</div>
            <div style={{ display: "flex", gap: ".4rem" }}>
              {r.listing.status !== "REMOVED" && <button style={{ ...small, color: "#ba1a1a" }} onClick={() => moderate(r.listing.id, "remove")}>Elanı sil</button>}
              <button style={small} onClick={() => dismiss(r.id)}>Rədd et</button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.1rem", margin: "0 0 .6rem" }}>Son elanlar</h2>
      <div style={{ display: "grid", gap: ".5rem" }}>
        {stats?.latest.map((p) => (
          <div key={p.id} style={{ ...card, display: "flex", alignItems: "center", gap: ".7rem" }}>
            {p.photo && <img src={p.photo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
              <div style={{ fontSize: ".75rem", color: "var(--outline)" }}>{p.shop} · {p.price} ₼ · {p.status}{p.isDemo ? " · demo" : ""}</div>
            </div>
            {p.status === "REMOVED"
              ? <button style={small} onClick={() => moderate(p.id, "restore")}>Bərpa et</button>
              : <button style={{ ...small, color: "#ba1a1a" }} onClick={() => moderate(p.id, "remove")}>Sil</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
