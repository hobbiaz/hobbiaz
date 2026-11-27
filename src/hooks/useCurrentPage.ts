"use client";

import { usePathname } from "next/navigation";

export type PageName = "home" | "video" | "search" | "messages" | "profile" | "settings";

export const PAGE_ROUTES: Record<PageName, string> = {
  home: "/",
  video: "/reels",
  search: "/search",
  messages: "/messages",
  profile: "/profile",
  settings: "/settings",
};

/** Maps the current route to the legacy page name used by the stylesheet ids. */
export function useCurrentPage(): PageName {
  const path = usePathname() ?? "/";
  const match = (Object.entries(PAGE_ROUTES) as [PageName, string][]).find(([, r]) => r !== "/" && path.startsWith(r));
  return match ? match[0] : "home";
}
