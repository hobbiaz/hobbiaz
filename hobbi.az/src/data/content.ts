import type { CategorySlug, Conversation, Notification, Reel, SearchCollection, TrendStore } from "@/types";

export const CATEGORY_CHIPS: { slug: CategorySlug; label: string }[] = [
  { slug: "all", label: "Hamısı" },
  { slug: "keramika", label: "Keramika" },
  { slug: "zergerllik", label: "Zərgərlik" },
  { slug: "resm", label: "Rəsm" },
  { slug: "toxuculuq", label: "Xalçaçılıq" },
  { slug: "agac", label: "Ağac işi" },
  { slug: "musiqi", label: "Musiqi alətləri" },
];

export const SIDEBAR_CATEGORIES: { slug: CategorySlug; label: string }[] = [
  { slug: "keramika", label: "Keramika" },
  { slug: "resm", label: "Rəsm" },
  { slug: "zergerllik", label: "Zərgərlik" },
  { slug: "toxuculuq", label: "Toxuculuq" },
  { slug: "agac", label: "Ağac işi" },
  { slug: "musiqi", label: "Musiqi alətləri" },
];

export const POPULAR_CATEGORIES: { slug: CategorySlug; label: string; orange?: boolean }[] = [
  { slug: "keramika", label: "🏺 Keramika" },
  { slug: "toxuculuq", label: "🧵 Xalçaçılıq" },
  { slug: "resm", label: "🎨 Rəsm" },
  { slug: "zergerllik", label: "💍 Zərgərlik" },
  { slug: "musiqi", label: "🎵 Musiqi alətləri", orange: true },
  { slug: "agac", label: "🪵 Ağac işi", orange: true },
];

export const TREND_STORES: TrendStore[] = [
  { name: "Aysel Məmmədova", initial: "A", rating: "4.9", avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face" },
  { name: "Orxan Vəliyev", initial: "O", rating: "5.0", gradient: "linear-gradient(135deg,#1a7a5e,#006b58)", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face" },
  { name: "Lalə Qasımova", initial: "L", rating: "4.8", gradient: "linear-gradient(135deg,#944a00,#fc8f34)", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face" },
  { name: "Nigar Əliyeva", initial: "N", rating: "4.7", gradient: "linear-gradient(135deg,#7a3a8a,#b05ac0)", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face" },
];

export const NOTIFICATIONS: Notification[] = [
  { id: 1, icon: "🛒", title: "Yeni sifariş daxil oldu", text: "Gümüşü Minimalist Sırğalar məhsulunuza yeni sifariş var.", time: "15 dəqiqə əvvəl", unread: true },
  { id: 2, icon: "⭐", title: "Yeni rəy əlavə edildi", text: "Mağazan 5 ulduzla qiymətləndirildi!", time: "2 saat əvvəl", unread: true },
  { id: 3, icon: "💬", title: "Yeni mesajınız var", text: "Müştəri məhsul haqqında sual soruşdu.", time: "5 saat əvvəl", unread: false },
  { id: 4, icon: "📦", title: "Sifarişiniz yolda", text: "Rəngli Keramika Fincanlar sifarişi kuryer yolundadır.", time: "1 gün əvvəl", unread: false },
];

export const CONVERSATIONS: Conversation[] = [
  { id: 1, name: "Elvin Qasımov", initial: "E", gradient: "linear-gradient(135deg,#34495e,#2c3e50)", preview: "Bu məhsulla maraqlanıram – Gil qabı...", time: "14:20", unread: true, online: true },
  { id: 2, name: "Leyla Əliyeva", initial: "L", gradient: "linear-gradient(135deg,#e67e22,#f39c12)", preview: "Sifarişiniz artıq kuryerdədir!", time: "Dünən" },
  { id: 3, name: "Anar Məmmədov", initial: "A", gradient: "linear-gradient(135deg,#2980b9,#3498db)", preview: "Yeni dizaynlar gələn həftə hazır olacaq.", time: "2 gün əvvəl" },
  { id: 4, name: "Nigar Hüseynova", initial: "N", gradient: "linear-gradient(135deg,#8e44ad,#9b59b6)", preview: "Sifariş verə bilərəm bu həftə?", time: "3 gün əvvəl" },
  { id: 5, name: "Rauf Əlizadə", initial: "R", gradient: "linear-gradient(135deg,#1abc9c,#16a085)", preview: "Çox gözəl keramikadır, sifarişi göndərin.", time: "1 həftə" },
];

export const MESSAGE_TABS = ["Hamısı", "Oxunmamışlar", "Satıcılar"] as const;

export const REELS: Reel[] = [
  {
    id: "demo-1", creator: "yourname", creatorAvatar: "Y", isSeller: true, caption: "Qiymətində endirim oldu ✨",
    address: "Bakı", phone: "050 277 00 77", ratingCount: 5000, commentCount: 6000, shareCount: 7000,
    gradient: "linear-gradient(135deg,#1a4a40,#006b58,#0a8a6d)", emoji: "🏺", title: "Əl işi Turkuaz Vaza",
    video: "https://assets.mixkit.co/videos/16164/16164-720.mp4",
  },
  {
    id: "demo-2", creator: "zergerstudio", creatorAvatar: "Z", isSeller: true, caption: "Gümüş üzük sənəti",
    address: "Sumqayıt", phone: "055 123 45 67", ratingCount: 3200, commentCount: 1400, shareCount: 2100,
    gradient: "linear-gradient(135deg,#2d3a4a,#3d5a6a,#4a7a8a)", emoji: "💍", title: "Gümüş üzük sənəti",
    video: "https://assets.mixkit.co/videos/5222/5222-360.mp4",
  },
];

export const REEL_COMMENTS = [
  { user: "@aysel_art", time: "2 saat əvvəl", text: "Çox gözəl iş! 🔥", initial: "A", gradient: "linear-gradient(135deg,#e76262,#944a00)" },
  { user: "@orxan_design", time: "4 saat əvvəl", text: "Qiymət nədir?", initial: "O", gradient: "linear-gradient(135deg,#3a7bd5,#1a4a8a)" },
];

export const SHARE_CONTACTS = [
  { name: "Aysel", gradient: "linear-gradient(135deg,#e76262,#944a00)" },
  { name: "Orxan", gradient: "linear-gradient(135deg,#3a7bd5,#1a4a8a)" },
  { name: "Lalə", gradient: "linear-gradient(135deg,#944a00,#fc8f34)" },
  { name: "Nigar", gradient: "linear-gradient(135deg,#7a3a8a,#b05ac0)" },
  { name: "Elvin", gradient: "linear-gradient(135deg,#1a7a5e,#006b58)" },
];

const u = (id: string, size: number) => `https://images.unsplash.com/photo-${id}?w=${size}&h=${size}&fit=crop`;
const SETS = {
  dekor: ["1555041469-a586c61ea9bc", "1616486338812-3dadae4b4ace", "1513519245088-0e12902e5a38", "1507089947368-19c1da9775ae"],
  ketan: ["1579783902614-a3fb3927b6a5", "1547036967-23d11aacaee0", "1561214115-f2f134cc4912", "1460661419201-fd4cecdf8a8b"],
  hediyye: ["1549465220-1a8b9238cd48", "1607344645866-009c320b63e0", "1583394840584-38c0bdb5b37f", "1512909006721-3d6018887383"],
  aksesuar: ["1515562141207-7a88fb7ce338", "1584917865442-de89df76afd3", "1601924994987-69e26d50dc26", "1611085583191-a3b181a88401"],
};

export const SEARCH_COLLECTIONS: SearchCollection[] = [
  { slug: "ev-dekoru", title: "Ev Dekoru", mobileTitle: "Ev Dekoru və Estetika...", mobileMeta: "24 konsept • 7 gün öncə", desktopTitle: "Ev Dekoru və Estetika", desktopMeta: "128 əşya • 2 gün əvvəl", trending: false, imageIds: SETS.dekor, alt: "dekor" },
  { slug: "ketan-remler", title: "Kətan rəsmlər", mobileTitle: "Kətan rəsmlər", mobileMeta: "16 konsept • 2 gün öncə", desktopTitle: "Kətan rəsmlər", desktopMeta: "56 əşya • Dünən", trending: true, imageIds: SETS.ketan, alt: "ketan" },
  { slug: "hediyyelik", title: "Hədiyyəlik", mobileTitle: "Hədiyyəlik və özəl", mobileMeta: "24 konsept • 7 days", desktopTitle: "Hədiyyəlik və özəl", desktopMeta: "84 əşya • 5 saat əvvəl", trending: false, imageIds: SETS.hediyye, alt: "hediye" },
  { slug: "deb-aksesuar", title: "Dəb və Aksesuar", mobileTitle: "Dəb və Aksesuar", mobileMeta: "16 konsept • 2 gün öncə", desktopTitle: "Dəb və Aksesuar", desktopMeta: "210 əşya • 1 həftə əvvəl", trending: true, imageIds: SETS.aksesuar, alt: "aksesuar" },
];

export const collectionImage = (id: string, size: number) => u(id, size);

/**
 * Which categories fill each curated collection ("Sizin üçün seçilmiş kolleksiyalar").
 * The collage shows the first 4 listings of the collection.
 */
export const COLLECTION_CATEGORIES: Record<SearchCollection["slug"], CategorySlug[]> = {
  "ev-dekoru": ["keramika", "agac"],
  "ketan-remler": ["resm"],
  hediyyelik: ["toxuculuq", "musiqi", "digər"],
  "deb-aksesuar": ["zergerllik"],
};

/** Maps a search collection to the home feed category it filters by. */
export const COLLECTION_TO_CATEGORY: Record<SearchCollection["slug"], CategorySlug> = {
  "ev-dekoru": "all",
  "ketan-remler": "resm",
  hediyyelik: "all",
  "deb-aksesuar": "zergerllik",
};

/** Default suggestion buttons under the video search field ("Nə axtarırsınız?"), after recent searches. */
export const REEL_SEARCH_SUGGESTIONS = ["Keramika", "Toxuculuq", "Zərgərlik", "Ağac oyma", "Rəsm", "Makrame"];
