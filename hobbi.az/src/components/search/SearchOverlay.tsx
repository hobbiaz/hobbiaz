"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { collectionImage, COLLECTION_TO_CATEGORY, SEARCH_COLLECTIONS } from "@/data/content";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useUI } from "@/providers/UIProvider";
import type { SearchCollection } from "@/types";
import { IconInstagram, IconSomBack, IconSomCamera, IconSomSearch, IconSpdAction1, IconSpdAction2, IconSpdCamera, IconSpdLogo, IconSpdSearch, IconTiktok, IconTrend } from "@/components/icons";
import { pressable } from "@/lib/a11y";

type Phase = "closed" | "open" | "closing";

/**
 * Search takeover opened from the top-bar input: a full-screen sheet on phones and a
 * drop-down panel with a dimmed backdrop on desktop. Browser "back" closes it.
 */
export function SearchOverlay() {
  const { modal, openModal, closeModal, filterCategory, search } = useUI();
  const isMobile = useIsMobile();
  const isOpen = modal === "search";
  const [phase, setPhase] = useState<Phase>("closed");
  const somInput = useRef<HTMLInputElement>(null);
  const spdInput = useRef<HTMLInputElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setPhase("open");
      if (!pushed.current) { window.history.pushState({ searchOpen: true }, "", window.location.href); pushed.current = true; }
      const t = setTimeout(() => (isMobile ? somInput : spdInput).current?.focus(), isMobile ? 500 : 80);
      return () => clearTimeout(t);
    }
    pushed.current = false;
    setPhase((p) => (p === "open" ? "closing" : p));
    // Fallback in case animationend never fires (reduced motion, background tab).
    const t = setTimeout(() => setPhase((p) => (p === "closing" ? "closed" : p)), 400);
    return () => clearTimeout(t);
  }, [isOpen, isMobile]);

  useEffect(() => {
    const onPop = () => { if (isOpen) { pushed.current = false; closeModal(); } };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isOpen, closeModal]);

  const finishClose = () => setPhase((p) => (p === "closing" ? "closed" : p));
  const close = () => closeModal();
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const text = e.currentTarget.value;
    close();
    search(text);
  };
  const pick = (slug: SearchCollection["slug"]) => { close(); filterCategory(COLLECTION_TO_CATEGORY[slug]); };

  const mobileCls = isMobile ? (phase === "open" ? "anim-enter" : phase === "closing" ? "anim-exit" : undefined) : undefined;
  const panelCls = !isMobile ? (phase === "open" ? "spd-open" : phase === "closing" ? "spd-closing" : undefined) : undefined;
  const backdropCls = !isMobile ? (phase === "open" ? "bd-open" : phase === "closing" ? "bd-closing" : undefined) : undefined;

  return (
    <>
    <div id="search-overlay-mobile" className={mobileCls} onAnimationEnd={finishClose} role="dialog" aria-modal="true" aria-label="Axtarış">
      {/* Sticky Header */}
      <div className="som-header">
        <button className="som-back-btn" onClick={close} aria-label="Geri">
          <IconSomBack />
        </button>
        <div className="som-search-box">
          <input ref={somInput} id="som-input" type="search" placeholder="hobbi'də axtar" aria-label="Axtarış" enterKeyHint="search" onKeyDown={onSearchKey} />
          <div className="som-search-icons">
            <IconSomSearch />
            <div className="som-divider"></div>
            <IconSomCamera />
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="som-grid">
        {SEARCH_COLLECTIONS.map((c) => (
          <div key={c.slug} {...pressable} className="som-card" onClick={() => pick(c.slug)}>
            <div className="som-collage">
              {c.trending && <div className="som-trend-badge"><IconTrend /></div>}
              {c.imageIds.map((id, i) => (
                <div className="som-collage-cell" key={id}><img src={collectionImage(id, 200)} alt={`${c.alt} ${i + 1}`} loading="lazy" /></div>
              ))}
            </div>
            <div className="som-card-title">{c.mobileTitle}</div>
            <div className="som-card-meta">{c.mobileMeta}</div>
          </div>
        ))}
      </div>
    </div>


    {/* ══ DESKTOP SEARCH PANEL + BACKDROP ══ */}
    <div id="search-backdrop" className={backdropCls} onClick={close}></div>

    <div id="search-panel-desktop" className={panelCls} onAnimationEnd={(e) => e.target === e.currentTarget && finishClose()} role="dialog" aria-modal="true" aria-label="Axtarış paneli">
      {/* Navbar */}
      <div className="spd-navbar">
        {/* Logo */}
        <div {...pressable} style={{ flexShrink: "0", cursor: "pointer" }} onClick={close}>
          <IconSpdLogo />
        </div>

        {/* Search input */}
        <div className="spd-search-wrap">
          <IconSpdSearch />
          <input ref={spdInput} id="spd-input" type="search" placeholder="hobbi'də axtar" aria-label="Axtarış" enterKeyHint="search" onKeyDown={onSearchKey} />
          <div className="spd-divider"></div>
          <IconSpdCamera />
        </div>

        {/* Right actions */}
        <div className="spd-right-actions">
          <div className="spd-icon-btn">
            <IconSpdAction1 />
          </div>
          <div className="spd-icon-btn">
            <IconSpdAction2 />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="spd-content">
        <div className="spd-title">Sizin üçün seçilmiş kolleksiyalar</div>
        <div className="spd-subtitle">Hər biri sevgi və diqqətlə hazırlanmış əl işi dünyasını kəşf edin.</div>

        {/* 4-col grid */}
        <div className="spd-grid" id="spd-grid">
          {SEARCH_COLLECTIONS.map((c) => (
            <div key={`${c.slug}-${phase}`} {...pressable} className="spd-folder" onClick={() => pick(c.slug)}>
              <div className="spd-collage">
                {c.imageIds.map((id, i) => (
                  <div className="spd-collage-cell" key={id}><img src={collectionImage(id, 300)} alt={`${c.alt} ${i + 1}`} loading="lazy" /></div>
                ))}
              </div>
              <div className="spd-folder-title">{c.desktopTitle}</div>
              <div className="spd-folder-meta">{c.desktopMeta}</div>
            </div>
          ))}
        </div>

        {/* Promo banner */}
        <div className="spd-promo">
          <div className="spd-promo-left">
            <span className="spd-promo-badge">Yaradıcılığını gəlirə çevir</span>
            <div className="spd-promo-title">Cəmi 2 dəqiqədə öz mağazanı yarat<br />və satışa başla</div>
            <div className="spd-promo-desc">Hobbi.az hər kəsin öz məhsulunu yaradıb sata biləcəyi platformadır</div>
            <button className="spd-promo-btn" onClick={() => openModal("auth")}>Mağaza Aç</button>
          </div>
          <div className="spd-promo-images">
            <img className="spd-promo-img" src="https://images.unsplash.com/photo-1586105251261-72a756497a11?w=460&h=560&fit=crop" alt="usta 1" loading="lazy" />
            <img className="spd-promo-img" src="https://images.unsplash.com/photo-1615529328331-f8917597711f?w=460&h=560&fit=crop" alt="usta 2" loading="lazy" />
          </div>
        </div>

        {/* Footer */}
        <div className="spd-footer">
          <div className="spd-footer-left">
            <span className="spd-footer-brand">Hobbi.az</span>
            <span className="spd-footer-copy">© 2026 Müəllif hüquqları ilə qorunur.</span>
          </div>
          <div className="spd-footer-links">
            {/* All four go to Settings → Dəstək until dedicated pages exist. */}
            <Link href="/settings" onClick={close}>İş birliyi</Link>
            <Link href="/settings" onClick={close}>İradlar</Link>
            <Link href="/settings" onClick={close}>Təkliflər</Link>
            <Link href="/settings" onClick={close}>Kontakt</Link>
          </div>
          <div className="spd-footer-socials">
            <div className="spd-social-btn">
              <IconInstagram />
            </div>
            <div className="spd-social-btn">
              <IconTiktok />
            </div>
          </div>
        </div>
      </div>
    </div>{/* /#search-panel-desktop */}
    </>
  );
}

