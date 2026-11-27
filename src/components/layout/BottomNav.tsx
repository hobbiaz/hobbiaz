"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentPage, PAGE_ROUTES, type PageName } from "@/hooks/useCurrentPage";
import { useUI } from "@/providers/UIProvider";
import {
  IconBnProfile, IconBnReelsHome, IconBnReelsMessages, IconBnReelsProfile, IconBnReelsSearch, IconBnReelsVideo,
  IconHomeFilled, IconHomeOutline, IconMessagesFilled, IconMessagesOutline, IconSearchFilled, IconSearchOutline,
  IconVideoFilled, IconVideoOutline,
} from "@/components/icons";

interface Item {
  page: Exclude<PageName, "settings">;
  label: string;
  outline: React.ReactNode;
  filled: React.ReactNode;
  /** White single-glyph icon used on the dark reels screen. */
  reels: React.ReactNode;
  dot?: boolean;
}

const ITEMS: Item[] = [
  { page: "home", label: "Ana Səhifə", outline: <IconHomeOutline />, filled: <IconHomeFilled />, reels: <IconBnReelsHome /> },
  { page: "video", label: "Video", outline: <IconVideoOutline />, filled: <IconVideoFilled />, reels: <IconBnReelsVideo /> },
  { page: "search", label: "Axtar", outline: <IconSearchOutline />, filled: <IconSearchFilled />, reels: <IconBnReelsSearch /> },
  { page: "messages", label: "Mesajlar", outline: <IconMessagesOutline />, filled: <IconMessagesFilled />, reels: <IconBnReelsMessages /> },
  { page: "profile", label: "Profil", outline: <IconBnProfile />, filled: <IconBnProfile />, reels: <IconBnReelsProfile /> },
];

function useIsDarkTheme(theme: string) {
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mql.matches);
    const on = () => setSystemDark(mql.matches);
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return theme === "dark" || (theme === "auto" && systemDark);
}

/** Phone tab bar (hidden on desktop by CSS). */
export function BottomNav() {
  const page = useCurrentPage();
  const { productId, theme, resetCategory, unreadMessages } = useUI();
  const isDark = useIsDarkTheme(theme);
  const onReels = page === "video";
  // While the product detail panel is open only "home" looks active (legacy updateNavbarForDetail).
  const active: PageName = productId !== null ? "home" : page;

  return (
    <nav className={`bottom-nav${onReels && !isDark ? " force-reels-dark" : ""}`} id="bottom-nav">
      {ITEMS.map((item) => (
        <Link
          key={item.page}
          href={PAGE_ROUTES[item.page]}
          id={`bn-${item.page}`}
          className={`bottom-nav-item${active === item.page ? " active" : ""}`}
          onClick={() => resetCategory()}
        >
          {onReels ? (
            item.reels
          ) : (
            <>
              <span className="nav-icon icon-outline">{item.outline}</span>
              <span className="nav-icon icon-filled">{item.filled}</span>
              <span className="bn-label">{item.label}</span>
              {item.page === "messages" && unreadMessages > 0 && <div className="bottom-nav-dot" aria-label={`${unreadMessages} oxunmamış söhbət`} />}
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}
