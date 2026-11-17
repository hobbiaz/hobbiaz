"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { GlobalOverlays } from "@/components/overlays/GlobalOverlays";

/**
 * Page chrome from the legacy SPA: top bar, hover sidebar, phone tab bar and every
 * overlay (modals, search, product detail). Plain scaffold pages under /dev skip it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  // Each route change starts at the top, like the legacy `content.scrollTop = 0`.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (pathname.startsWith("/dev")) return <>{children}</>;

  return (
    <>
      <div className="app">
        <TopNav />
        <div className="main-wrap">
          <Sidebar />
          <main className="content" style={pathname === "/reels" ? { paddingBottom: 0 } : undefined}>
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
      <GlobalOverlays />
    </>
  );
}
