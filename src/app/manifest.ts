import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "hobbi.az — Əl işi və hobbi bazarı",
    short_name: "hobbi.az",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e76262",
    lang: "az",
    icons: [{ src: "/logo.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
