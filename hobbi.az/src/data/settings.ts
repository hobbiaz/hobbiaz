import type { ProfileData } from "@/types";

export type SettingsSection =
  | "account" | "account-type" | "activity" | "blocked" | "language"
  | "appearance" | "privacy" | "terms" | "about" | "support";

export const SETTINGS_META: Record<SettingsSection, { title: string; sub: string }> = {
  account: { title: "Hesab məlumatlarım", sub: "Şəxsi məlumatlarınızı və hesab tənzimləmələrini idarə edin." },
  "account-type": { title: "Hesab tipi", sub: "Alıcı və ya satıcı hesabı arasında seçim edin." },
  activity: { title: "Fəaliyyətlər", sub: "Son hesab fəaliyyətlərinizin tarixçəsi." },
  blocked: { title: "Bloklanmış", sub: "Blokladığınız istifadəçiləri idarə edin." },
  language: { title: "Dil", sub: "İnterfeys dilini seçin." },
  appearance: { title: "Görünüş", sub: "Tətbiqin görünüş rejimini tənzimləyin." },
  privacy: { title: "Məxfilik siyasəti", sub: "Məlumatlarınızın necə qorunduğu haqqında." },
  terms: { title: "İstifadə şərtləri", sub: "Platformadan istifadə qaydaları." },
  about: { title: "Haqqında", sub: "Hobbi platforması haqqında məlumat." },
  support: { title: "Dəstək", sub: "Komandamızla əlaqə saxlayın." },
};

export const SETTINGS_ACTIVITIES = [
  { icon: "🛒", text: "Keramika fincan sifariş etdiniz", time: "2 saat əvvəl" },
  { icon: "⭐", text: "Mağazanıza 5 ulduz rəy verdiniz", time: "1 gün əvvəl" },
  { icon: "💬", text: "Sənətkarla mesajlaşdınız", time: "3 gün əvvəl" },
  { icon: "❤️", text: "Xalça kolleksiyasını bəyəndiniz", time: "1 həftə əvvəl" },
];

export const SETTINGS_BLOCKED = [
  { id: "u1", name: "@spam_satici", reason: "Spam mesajlar" },
  { id: "u2", name: "@fake_shop", reason: "Saxta məhsul elanı" },
];

export const DEFAULT_PROFILE: ProfileData = {
  name: "Orxan Məmmədov",
  email: "orxan@example.com",
  phone: "+994 50 123 45 67",
  location: "Bakı, Azərbaycan",
  bio: "Keramika həvəskarı. Hər bir əsər bir hekayə danışır. ✨",
};

export const APP_VERSION = "Versiya 2.4.0 (Build 42)";
