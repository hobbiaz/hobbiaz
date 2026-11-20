"use client";

import Link from "next/link";
import { useCurrentPage } from "@/hooks/useCurrentPage";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useUI } from "@/providers/UIProvider";
import { IconLogo, IconSearch } from "@/components/icons";
import { NotificationsMenu } from "./NotificationsMenu";
import { ShareMenu } from "./ShareMenu";
import { pressable } from "@/lib/a11y";

export function TopNav() {
  const page = useCurrentPage();
  const isMobile = useIsMobile();
  const { openModal, resetCategory, user, backend, openAuth } = useUI();
  const avatar = user?.store?.avatarUrl ?? user?.avatarUrl;
  const initial = (user?.store?.name ?? user?.name ?? "?")[0]?.toUpperCase();

  const searchHidden = page === "search" || page === "messages" || page === "profile";
  // On phones the top bar only exists on the home feed (legacy showPage behaviour).
  const hidden = isMobile && page !== "home";

  return (
    <nav className="topnav" id="topnav-main" style={hidden ? { display: "none" } : undefined}>
      <Link
        href="/"
        className="topnav-logo"
        style={{ cursor: "pointer" }}
        aria-label="hobbi.az ana səhifə"
        onClick={() => resetCategory()}
      >
        <IconLogo />
      </Link>

      <div {...pressable}
        className={`topnav-search${searchHidden ? " hidden" : ""}`}
        id="topnav-search"
        onClick={() => openModal("search")}
      >
        <IconSearch />
        <input
          type="text"
          placeholder="Məhsul axtar"
          readOnly
          onFocus={(e) => {
            e.currentTarget.blur();
            openModal("search");
          }}
        />
      </div>

      <div className="topnav-actions">
        <NotificationsMenu />
        <ShareMenu />
        {backend === "online" && !user && (
          <button
            type="button"
            onClick={() => openAuth("login")}
            style={{ height: 36, padding: "0 .9rem", borderRadius: 9999, border: "1.5px solid var(--outline-var)", background: "transparent", color: "var(--on-surface)", fontWeight: 600, fontSize: ".82rem", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Daxil ol
          </button>
        )}
        {user && (
          <Link href="/profile" aria-label="Profil" title={user.store?.name ?? user.name} style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#3E91C4", color: "#fff", fontWeight: 700, fontSize: ".85rem", flexShrink: 0 }}>
            {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
          </Link>
        )}
      </div>
    </nav>
  );
}
