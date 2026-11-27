import type { Product } from "@/types";

/** Offline demo catalogue from the legacy prototype; used when the API/database is unavailable, and by the seed. */
export const PRODUCTS: Product[] = [
  {
    "id": "demo-0",
    "title": "Gümüşü Minimalist Sırğalar",
    "price": "45",
    "oldPrice": "89",
    "shop": "ZərgərStudio",
    "badge": null,
    "color": "#c8d8e4",
    "cat": "zergerllik",
    "emoji": "💍",
    "phone": "+994 50 111 22 33",
    "photo": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbeff0a5?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1605100804763-247f67b35585?w=400&h=500&fit=crop"
    ],
    "desc": "Gümüş ərintilərdən əl ilə hazırlanmış minimalist sırğalar."
  },
  {
    "id": "demo-1",
    "title": "Dəri Üzlük (Sifarişlə)",
    "price": "32",
    "oldPrice": "58",
    "shop": "DəriSənət",
    "badge": "YENİ",
    "color": "#d4a57a",
    "cat": "digər",
    "emoji": "👜",
    "phone": "+994 50 222 33 44",
    "photo": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac03a683814?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584917865442-de89d76c862a?w=400&h=400&fit=crop"
    ],
    "desc": "Sifarişlə hazırlanan natürel dəri üzlük."
  },
  {
    "id": "demo-2",
    "title": "Taxta Masaüstü Düzənləyici",
    "price": "28",
    "oldPrice": "45",
    "shop": "ağacMaster",
    "badge": null,
    "color": "#b5977a",
    "cat": "agac",
    "emoji": "🪵",
    "phone": "+994 50 333 44 55",
    "photo": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=520&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=520&fit=crop",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=520&fit=crop",
      "https://images.unsplash.com/photo-1616628188859-7a11abb6fcc8?w=400&h=520&fit=crop"
    ],
    "desc": "Qoz ağacından hazırlanmış masaüstü düzənləyici."
  },
  {
    "id": "demo-3",
    "title": "Rəngli Keramika Fincanlar",
    "price": "18",
    "oldPrice": "35",
    "shop": "GilStudio",
    "badge": "POPULYAR",
    "color": "#7eb8a0",
    "cat": "keramika",
    "emoji": "🏺",
    "phone": "+994 50 444 55 66",
    "photo": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400&h=400&fit=crop"
    ],
    "desc": "Əl ilə şəkilləndirilmiş unikal rəngarəng sırlı keramika fincanlar."
  },
  {
    "id": "demo-4",
    "title": "Əl İşi Macramé",
    "price": "55",
    "oldPrice": "90",
    "shop": "LifeDecor",
    "badge": null,
    "color": "#c9b8d0",
    "cat": "toxuculuq",
    "emoji": "🧵",
    "phone": "+994 50 555 66 77",
    "photo": "https://images.unsplash.com/photo-1558171813-30e3c04a7db8?w=400&h=520&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1558171813-30e3c04a7db8?w=400&h=520&fit=crop",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=520&fit=crop",
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=520&fit=crop"
    ],
    "desc": "Premium pambıq ipindən hazırlanmış divar dekorasiyası."
  },
  {
    "id": "demo-5",
    "title": "Akvarel Çiçək Tablosu",
    "price": "80",
    "oldPrice": "130",
    "shop": "ArtByLeyla",
    "badge": "ENDİRİM",
    "color": "#e8c4b8",
    "cat": "resm",
    "emoji": "🎨",
    "phone": "+994 50 666 77 88",
    "photo": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=400&fit=crop"
    ],
    "desc": "Rəssam Leyla tərəfindən əl ilə çəkilmiş A3 formatlı akvarel tablosu."
  },
  {
    "id": "demo-6",
    "title": "Abstrakt Kətan (Sifarişlə)",
    "price": "120",
    "oldPrice": "190",
    "shop": "RəqəmsalArt",
    "badge": "POPULYAR",
    "color": "#7a9e87",
    "cat": "resm",
    "emoji": "🖼️",
    "phone": "+994 50 777 88 99",
    "photo": "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=520&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=520&fit=crop",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=520&fit=crop",
      "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=520&fit=crop"
    ],
    "desc": "Müştəri tələbinə uyğun abstrakt kətan rəsm. Çatdırılma 7–10 gün."
  },
  {
    "id": "demo-7",
    "title": "Minimal Keramika Vaza",
    "price": "35",
    "oldPrice": "62",
    "shop": "GilStudio",
    "badge": null,
    "color": "#c5cfe0",
    "cat": "keramika",
    "emoji": "🏺",
    "phone": "+994 50 888 99 00",
    "photo": "https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400&h=400&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"
    ],
    "desc": "Skandinav üslubunda minimal dizaynlı ağ keramika vaza."
  },
  {
    "id": "demo-8",
    "title": "Ağac Çərçivə Güzgü",
    "price": "42",
    "oldPrice": "75",
    "shop": "ağacMaster",
    "badge": "YENİ",
    "color": "#c4a882",
    "cat": "agac",
    "emoji": "🪞",
    "phone": "+994 50 999 00 11",
    "photo": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=520&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=520&fit=crop",
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=520&fit=crop",
      "https://images.unsplash.com/photo-1616628188859-7a11abb6fcc8?w=400&h=520&fit=crop"
    ],
    "desc": "Əl işi ağac çərçivəli divar güzgüsü."
  },
  {
    "id": "demo-9",
    "title": "İpək Boyunbağı Dəsti",
    "price": "68",
    "oldPrice": "110",
    "shop": "ZərgərStudio",
    "badge": "POPULYAR",
    "color": "#e8d5b0",
    "cat": "zergerllik",
    "emoji": "📿",
    "phone": "+994 50 000 00 00",
    "photo": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
    "images": [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbeff0a5?w=400&h=400&fit=crop"
    ],
    "desc": "Əl ilə toxunmuş ipək saplardan hazırlanmış boyunbağı dəsti."
  }
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
