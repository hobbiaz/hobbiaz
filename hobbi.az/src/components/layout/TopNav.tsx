"use client";

import Link from "next/link";
import { useCurrentPage } from "@/hooks/useCurrentPage";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useUI } from "@/providers/UIProvider";
import { IconLogo, IconSearch } from "@/components/icons";
import { NotificationsMenu } from "./NotificationsMenu";
import { ShareMenu } from "./ShareMenu";

export function TopNav() {
  const page = useCurrentPage();
  const isMobile = useIsMobile();
  const { openModal, resetCategory } = useUI();

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

      <div
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
      </div>
    </nav>
  );
}
