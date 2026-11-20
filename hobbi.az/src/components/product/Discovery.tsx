"use client";

import { useEffect, useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { DEFAULT_AD, type AdData } from "@/lib/product-detail";
import { readJSON, readStorage, writeStorage } from "@/lib/storage-client";
import { useUI } from "@/providers/UIProvider";
import { IconSponsoredCheck } from "@/components/icons";
import { pressable } from "@/lib/a11y";

const AD_KEY = "pd_ad_data";

/**
 * Sponsored tile. The edit/remove controls are a local design preview only: they show in
 * development when localStorage isAdmin=true and never in a production build. Real
 * admin rights must come from the server session (role ADMIN).
 */
function AdCard() {
  const { toast, openModal } = useUI();
  const [ad, setAd] = useState<AdData>(DEFAULT_AD);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setAd(readJSON<AdData>(AD_KEY, DEFAULT_AD) ?? DEFAULT_AD);
    setIsAdmin(process.env.NODE_ENV !== "production" && readStorage("isAdmin") === "true");
  }, []);

  const edit = () => {
    const logo = prompt("Reklam logo URL:", ad.logo); if (logo === null) return;
    const title = prompt("Reklam başlığı:", ad.title); if (title === null) return;
    const sub = prompt("Alt mətn:", ad.sub); if (sub === null) return;
    const link = prompt("Link URL:", ad.link || "") ?? "";
    const next = { logo, title, sub, link };
    writeStorage(AD_KEY, JSON.stringify(next));
    setAd(next);
    toast("Reklam yeniləndi ✅");
  };
  const remove = () => {
    if (!confirm("Reklamı silmək istəyirsiniz?")) return;
    writeStorage(AD_KEY, null);
    setAd(DEFAULT_AD);
  };

  return (
    <div {...pressable}
      className="pd-ad-card"
      id="pd-ad-card"
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("pd-admin-btn")) return;
        // Only http(s) links open; the house ad (no link) starts store onboarding.
        if (/^https?:\/\//i.test(ad.link)) window.open(ad.link, "_blank", "noopener");
        else openModal("auth");
      }}
    >
      <div className="pd-ad-top">
        <img className="pd-ad-logo" src={ad.logo} alt={ad.title} />
        <span className="pd-ad-arrow">↗</span>
      </div>
      <div>
        <div className="pd-ad-title">{ad.title}</div>
        <div className="pd-ad-sub">{ad.sub}</div>
        <div className="pd-ad-sponsored">
          <div className="pd-ad-check"><IconSponsoredCheck /></div>
          <span className="pd-ad-sponsored-text">SPONSORLU</span>
        </div>
      </div>
      <div className={`pd-ad-admin-controls${isAdmin ? " show" : ""}`} id="pd-ad-admin-ctrls">
        <button className="pd-admin-btn" onClick={edit}>Dəyiş</button>
        <button className="pd-admin-btn" onClick={remove}>Sil</button>
      </div>
    </div>
  );
}

/** "Bunları da sevə bilərsən" — up to 8 other products in random order plus the ad tile. */
export function Discovery({ productId, onOpen }: { productId: number; onOpen: (id: number) => void }) {
  const others = useMemo(
    () => PRODUCTS.filter((p) => p.id !== productId).sort(() => Math.random() - 0.5).slice(0, 8),
    [productId],
  );
  return (
    <div className="pd-discovery">
      <h2 className="pd-discovery-title">Bunları da sevə bilərsən.</h2>
      <div className="pd-masonry" id="pd-discovery-grid">
        {others.map((item) => (
          <div key={item.id} {...pressable} className="pd-rec-card" onClick={() => onOpen(item.id)}>
            <img src={item.images[0] || item.photo} alt={item.title} loading="lazy" />
            <span className="pd-rec-price">{item.price} AZN</span>
          </div>
        ))}
        <AdCard />
      </div>
    </div>
  );
}
