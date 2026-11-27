import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CATEGORY_SLUGS } from "@/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["", "/reels", "/search"].map((p) => ({ url: `${SITE_URL}${p || "/"}`, lastModified: now }));
  const cats = CATEGORY_SLUGS.filter((c) => c !== "all").map((c) => ({ url: `${SITE_URL}/?cat=${encodeURIComponent(c)}`, lastModified: now }));
  return [...pages, ...cats];
}
