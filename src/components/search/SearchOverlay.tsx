"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useCollections, usePopularSearches } from "@/hooks/useCollections";
import { useUI } from "@/providers/UIProvider";
import type { CollectionSummary } from "@/types";
import { IconInstagram, IconSomBack, IconSomCamera, IconSomSearch, IconSpdCamera, IconSpdLogo, IconSpdSearch, IconTiktok, IconTrend } from "@/components/icons";
import { pressable } from "@/lib/a11y";
import { timeAgo } from "@/lib/api-client";

const metaOf = (c: CollectionSummary) =>
  [`${c.count} əşya`, c.ownerName, c.updatedAt ? timeAgo(c.updatedAt) : ""].filter(Boolean).join(" • ");

/**
 * Collage from the first 4 product photos. With fewer photos the cells grow to fill the
 * square (1 = whole, 2 = halves, 3 = one tall + two) instead of leaving grey gaps.
 */
function Collage({ c, cellClass }: { c: CollectionSummary; cellClass: string }) {
  const photos = c.images.filter(Boolean).slice(0, 4);
  if (!photos.length) return <div className={`${cellClass} search-collage-empty collage-span-all`} aria-hidden="true" />;
  return (
    <>
      {photos.map((src, i) => (
        <div className={`${cellClass} collage-n${photos.length}-${i}`} key={src + i}>
          <img src={src} alt={`${c.title} ${i + 1}`} loading="lazy" />
        </div>
      ))}
    </>
  );
}

/** "Son axtarışlar" + "Ən çox axtarılanlar" shown under the empty search field. */
function Suggestions({ recent, popular, onPick, className }: { recent: string[]; popular: string[]; onPick: (t: string) => void; className: string }) {
  const top = popular.filter((p) => !recent.some((r) => r.toLocaleLowerCase("az") === p)).slice(0, 3);
  if (!recent.length && !top.length) return null;
  return (
    <div className={className} role="listbox" aria-label="Axtarış təklifləri" onMouseDown={(e) => e.preventDefault()}>
      {recent.length > 0 && <div className="search-suggest-head">Son axtarışlar</div>}
      {recent.map((t) => (
        <div key={"r" + t} {...pressable} role="option" aria-selected={false} className="search-suggest-item" onClick={() => onPick(t)}>
          <span className="search-suggest-icon" aria-hidden="true">🕘</span>{t}
        </div>
      ))}
      {top.length > 0 && <div className="search-suggest-head">Ən çox axtarılanlar</div>}
      {top.map((t) => (
        <div key={"p" + t} {...pressable} role="option" aria-selected={false} className="search-suggest-item" onClick={() => onPick(t)}>
          <span className="search-suggest-icon" aria-hidden="true">🔥</span>{t}
        </div>
      ))}
    </div>
  );
}

type Phase = "closed" | "open" | "closing";

/**
 * Search takeover opened from the top-bar input: a full-screen sheet on phones and a
 * drop-down panel with a dimmed backdrop on desktop. Browser "back" closes it.
 */
export function SearchOverlay() {
  const { modal, openModal, closeModal, search, recentSearches, requireAuth, openAuth, user } = useUI();
  const router = useRouter();
  const isMobile = useIsMobile();
  const isOpen = modal === "search";
  const collections = useCollections(isOpen);
  const popular = usePopularSearches(isOpen);
  const [suggestOpen, setSuggestOpen] = useState(false);
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
  const pick = (id: string) => { close(); router.push(`/collections/${encodeURIComponent(id)}`); };
  const pickSuggestion = (text: string) => { setSuggestOpen(false); close(); search(text); };
  const createCollection = () => {
    if (!requireAuth("Kolleksiya yaratmaq üçün daxil olun")) return;
    close();
    router.push("/collections/new");
  };
  const inputHandlers = {
    // Not on focus: the field is auto-focused when the panel opens, and the list would cover the page.
    onClick: (e: React.MouseEvent<HTMLInputElement>) => setSuggestOpen(!e.currentTarget.value),
    onBlur: () => setSuggestOpen(false),
    onInput: (e: React.FormEvent<HTMLInputElement>) => setSuggestOpen(!e.currentTarget.value),
  };
  const suggestions = (className: string) =>
    suggestOpen && <Suggestions className={className} recent={recentSearches} popular={popular} onPick={pickSuggestion} />;
  const list = collections ?? [];

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
          <input ref={somInput} id="som-input" type="search" placeholder="hobbi'də axtar" aria-label="Axtarış" enterKeyHint="search" onKeyDown={onSearchKey} {...inputHandlers} />
          <div className="som-search-icons">
            <IconSomSearch />
            <div className="som-divider"></div>
            <button type="button" className="search-filter-btn" onClick={() => openModal("filter")} aria-label="Filtrlər"><IconSomCamera /></button>
          </div>
        </div>
      </div>
      {suggestions("search-suggest search-suggest-mobile")}

      <div className="som-actions">
        <button type="button" className="collection-create-btn" onClick={createCollection}>+ Kolleksiya yarat</button>
      </div>

      {/* Category Grid */}
      <div className="som-grid">
        {list.map((c) => (
          <div key={c.id} {...pressable} className="som-card" onClick={() => pick(c.id)}>
            <div className="som-collage">
              {c.trending && <div className="som-trend-badge"><IconTrend /></div>}
              <Collage c={c} cellClass="som-collage-cell" />
            </div>
            <div className="som-card-title">{c.title}</div>
            <div className="som-card-meta">{metaOf(c)}</div>
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
          <input ref={spdInput} id="spd-input" type="search" placeholder="hobbi'də axtar" aria-label="Axtarış" enterKeyHint="search" onKeyDown={onSearchKey} {...inputHandlers} />
          <div className="spd-divider"></div>
          <button type="button" className="search-filter-btn" onClick={() => openModal("filter")} aria-label="Filtrlər" title="Filtrlər"><IconSpdCamera /></button>
          {suggestions("search-suggest search-suggest-desktop")}
        </div>

        {/* Right actions */}
        <div className="spd-right-actions">
          <button type="button" className="collection-create-btn" onClick={createCollection}>+ Kolleksiya yarat</button>
        </div>
      </div>

      {/* Main content */}
      <div className="spd-content">
        <div className="spd-title">Sizin üçün seçilmiş kolleksiyalar</div>
        <div className="spd-subtitle">Hər biri sevgi və diqqətlə hazırlanmış əl işi dünyasını kəşf edin.</div>

        {/* 4-col grid */}
        <div className="spd-grid" id="spd-grid">
          {list.map((c) => (
            <div key={`${c.id}-${phase}`} {...pressable} className="spd-folder" onClick={() => pick(c.id)}>
              <div className="spd-collage">
                <Collage c={c} cellClass="spd-collage-cell" />
              </div>
              <div className="spd-folder-title">{c.title}</div>
              <div className="spd-folder-meta">{metaOf(c)}</div>
            </div>
          ))}
          {collections === null && <div className="spd-folder-meta">Yüklənir…</div>}
        </div>

        {/* Promo banner */}
        <div className="spd-promo">
          <div className="spd-promo-left">
            <span className="spd-promo-badge">Yaradıcılığını gəlirə çevir</span>
            <div className="spd-promo-title">Cəmi 2 dəqiqədə öz mağazanı yarat<br />və satışa başla</div>
            <div className="spd-promo-desc">Hobbi.az hər kəsin öz məhsulunu yaradıb sata biləcəyi platformadır</div>
            <button className="spd-promo-btn" onClick={() => (user ? (close(), router.push("/profile")) : openAuth("register"))}>Mağaza Aç</button>
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

