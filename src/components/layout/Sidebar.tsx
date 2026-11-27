"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SIDEBAR_CATEGORIES } from "@/data/content";
import { useCurrentPage, PAGE_ROUTES, type PageName } from "@/hooks/useCurrentPage";
import { useUI } from "@/providers/UIProvider";
import {
  IconCategories, IconHomeFilled, IconHomeOutline, IconMessagesFilled, IconMessagesOutline, IconMore,
  IconProfileOutline, IconSearchFilled, IconSearchOutline, IconSettings, IconSidebarCatsChevron,
  IconVideoFilled, IconVideoOutline,
} from "@/components/icons";
import { pressable } from "@/lib/a11y";

const ICON_BOX = { width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } as const;

const NAV: { page: PageName; label: string; outline: React.ReactNode; filled: React.ReactNode }[] = [
  { page: "home", label: "Ana Səhifə", outline: <IconHomeOutline />, filled: <IconHomeFilled /> },
  { page: "video", label: "Lent", outline: <IconVideoOutline />, filled: <IconVideoFilled /> },
  { page: "search", label: "Axtar", outline: <IconSearchOutline />, filled: <IconSearchFilled /> },
  { page: "messages", label: "Mesajlar", outline: <IconMessagesOutline />, filled: <IconMessagesFilled /> },
  { page: "profile", label: "Profil", outline: <IconProfileOutline />, filled: <IconProfileOutline /> },
];

/** Desktop rail that expands on hover (≥1024px); hidden on phones by CSS. */
export function Sidebar() {
  const page = useCurrentPage();
  const { category, filterCategory, resetCategory, toast, unreadMessages, user } = useUI();
  const badgeFor = (p: PageName) => (p === "messages" && unreadMessages > 0 ? unreadMessages : undefined);
  const avatar = user?.store?.avatarUrl ?? user?.avatarUrl;
  const profileFilled = avatar
    ? <span className="profile-filled-icon"><img src={avatar} alt="Profil" /></span>
    : <span className="profile-filled-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#3E91C4", color: "#fff", fontWeight: 700, fontSize: ".75rem" }}>{(user?.store?.name ?? user?.name ?? "?")[0]?.toUpperCase()}</span>;
  const [catsOpen, setCatsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    document.body.classList.toggle("sidebar-expanded", expanded);
  }, [expanded]);

  const onEnter = () => {
    if (window.innerWidth < 1024) return;
    clearTimeout(closeTimer.current);
    setExpanded(true);
  };
  const onLeave = () => {
    if (window.innerWidth < 1024) return;
    closeTimer.current = setTimeout(() => setExpanded(false), 180);
  };

  return (
    <aside className={`sidebar${expanded ? " is-expanded" : ""}`} id="desktop-sidebar" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="sidebar-inner">
        <div className="sidebar-top">
          <div className={`sidebar-cats-scroll${catsOpen ? " is-open" : ""}`} id="sidebar-cats-scroll">
            <div {...pressable} className="sidebar-cats-header" onClick={() => setCatsOpen((o) => !o)}>
              <span className="nav-icon" style={ICON_BOX}><IconCategories /></span>
              <span className="sidebar-text" style={{ fontWeight: 600, fontSize: ".88rem" }}>Kateqoriyalar</span>
              <IconSidebarCatsChevron />
            </div>
            <div className="sidebar-cats-list" id="sidebar-cats-list">
              {SIDEBAR_CATEGORIES.map((c) => (
                <div key={c.slug}
                  {...pressable}
                  className={`nav-item${page === "home" && category === c.slug ? " active" : ""}`}
                  data-cat={c.slug}
                  onClick={() => filterCategory(c.slug)}
                >
                  <span className="sidebar-text">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV.map((item) => (
              <Link
                key={item.page}
                href={PAGE_ROUTES[item.page]}
                className={`nav-item${page === item.page ? " active" : ""}`}
                data-page={item.page}
                onClick={() => resetCategory()}
              >
                <span className="nav-icon icon-outline">{item.outline}</span>
                <span className="nav-icon icon-filled">{item.page === "profile" && user ? profileFilled : item.filled}</span>
                <span className="sidebar-text">{item.label}</span>
                {badgeFor(item.page) !== undefined && (
                  <>
                    <span className="dot sidebar-text" />
                    <span className="nav-badge">{badgeFor(item.page)}</span>
                  </>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <Link href={PAGE_ROUTES.settings} className={`nav-item${page === "settings" ? " active" : ""}`}>
            <span className="nav-icon" style={ICON_BOX}><IconSettings /></span>
            <span className="sidebar-text">Parametrlər</span>
          </Link>
          {user?.role === "ADMIN" ? (
            <Link href="/admin" className="nav-item">
              <span className="nav-icon" style={ICON_BOX}><IconMore /></span>
              <span className="sidebar-text">Admin panel</span>
            </Link>
          ) : (
            <div {...pressable} className="nav-item" onClick={() => toast("Daha çox seçimlər tezliklə")}>
              <span className="nav-icon" style={ICON_BOX}><IconMore /></span>
              <span className="sidebar-text">Daha çox</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
