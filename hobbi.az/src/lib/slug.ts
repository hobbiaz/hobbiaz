const MAP: Record<string, string> = { ə: "e", ı: "i", ö: "o", ü: "u", ğ: "g", ş: "s", ç: "c", İ: "i", Ə: "e" };

/** URL-safe slug that keeps Azerbaijani letters readable: "Aysel Keramika" → "aysel-keramika". */
export function slugify(text: string): string {
  return text
    .trim()
    .replace(/[əıöüğşçİƏ]/g, (c) => MAP[c] ?? c)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "magaza";
}
