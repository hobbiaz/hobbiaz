"use client";
import { useState } from "react";
export function FavoriteButton({ listingId, initial }: { listingId: string; initial: boolean }) {
  const [fav, setFav] = useState(initial); const [err, setErr] = useState("");
  async function toggle() {
    const res = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId }) });
    if (!res.ok) { setErr((await res.json()).error ?? "Xəta"); return; }
    setFav((await res.json()).favorited); setErr("");
  }
  return <><button className="hb-btn" onClick={toggle} aria-pressed={fav}>{fav ? "♥ Seçilmişlərdən çıxar" : "♡ Seçilmişlərə əlavə et"}</button>{err && <span role="alert" className="hb-error"> {err}</span>}</>;
}
