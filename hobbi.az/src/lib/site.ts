/** Public origin used for absolute URLs (canonical, sitemap, OG). Set APP_ORIGIN in production. */
export const SITE_URL = (process.env.APP_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "hobbi.az";
export const SITE_DESCRIPTION = "Azərbaycanlı əl işi sənətkarlarını alıcılarla birləşdirən platforma.";
