"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentPage } from "@/hooks/useCurrentPage";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useUI } from "@/providers/UIProvider";
import { IconLogo, IconPen, IconSearch } from "@/components/icons";
import { NotificationsMenu } from "./NotificationsMenu";
import { ShareMenu } from "./ShareMenu";
import { pressable } from "@/lib/a11y";
import { BULK_MESSAGE_EVENT } from "@/lib/events";

export function TopNav() {
  const page = useCurrentPage();
  const isMobile = useIsMobile();
  const { openModal, resetCategory, user, backend, openAuth, toast } = useUI();
  const router = useRouter();
  // Only stores share videos. Signed out → store registration; a buyer account → open a store on the profile.
  const uploadVideo = () => {
    if (backend === "offline") { toast("Demo rejim: server qoşulmayıb"); return; }
    if (!user) { toast("Video paylaşmaq üçün mağaza hesabı lazımdır"); openAuth("register"); return; }
    if (user.role === "BUYER") { toast("Video paylaşmaq üçün əvvəlcə mağaza açın"); router.push("/profile"); return; }
    openModal("reelUpload");
  };
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
        {page === "video" ? (
          // Lent: the only action is uploading a video.
          <button
            type="button"
            className="video-upload-btn"
            onClick={uploadVideo}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></svg>
            Video yüklə
          </button>
        ) : page === "messages" ? (
          <>
            <NotificationsMenu />
            {/* Messages: the share menu makes way for "Toplu mesaj" (message several chats at once). */}
            <button
              type="button"
              className="topnav-icon-btn"
              aria-label="Toplu mesaj göndər"
              title="Toplu mesaj"
              onClick={() => window.dispatchEvent(new Event(BULK_MESSAGE_EVENT))}
            >
              <IconPen />
            </button>
          </>
        ) : (
          <>
            <NotificationsMenu />
            <ShareMenu />
          </>
        )}
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
