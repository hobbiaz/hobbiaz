# hobbi.az — Next.js + Prisma + PostgreSQL

Azərbaycan hobbi/əl işi bazarı. Stack: Next.js 15 (App Router), React 19, strict TypeScript, Prisma, PostgreSQL, Zod, jose (JWT cookie sessiyası) + bcryptjs, Vitest.

> **Status:** `legacy/hobbi_az_ESAS_BUDUR_SİLME_.html` dizaynı tam olaraq React komponentlərinə köçürülüb. `typecheck`, `lint`, `test` və `build` xətasız keçir. Frontend hələlik demo data ilə işləyir (`src/data/`) və API-yə qoşulmayıb. Backend (API + Prisma) əvvəlki kimidir, işə salmaq üçün PostgreSQL lazımdır.

## Quraşdırma
```bash
npm install
npm run dev                 # http://localhost:3000 — dizayn DB olmadan da açılır
```
API və DB üçün:
```bash
cp .env.example .env        # DATABASE_URL, AUTH_SECRET, SEED_DEMO_PASSWORD doldurun
npm run db:deploy           # prisma/migrations/ altındakı migration-ları tətbiq edir
npm run db:seed
```
Yoxlamalar: `npm run typecheck && npm run lint && npm test && npm run build`

## Mühit dəyişənləri
`DATABASE_URL`, `AUTH_SECRET` (32+ simvol), `APP_ORIGIN`, `UPLOAD_DIR`, `SEED_DEMO_PASSWORD`, `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (admin yalnız ikisi də verilərsə yaranır; kodda admin parolu yoxdur), `SEED_DEMO_REEL_URL` (istəyə bağlı: demo reel üçün video linki).

Sxemi dəyişəndə: `npm run db:migrate -- --name <ad>` yeni migration yaradır. Bazanı heç vaxt əl ilə dəyişməyin.

DB qoşulmayanda `/api/*` 503 "Verilənlər bazası əlçatan deyil" qaytarır (server logunda səbəb yazılır).

## Səhifələr
| Route | Komponent | Orijinalda |
|---|---|---|
| `/` | `components/home/HomeFeed` | `#page-home` (kateqoriya çipləri, məhsul kartları, trend mağazalar) |
| `/reels` | `components/reels/ReelsFeed` | `#page-video` (ulduz reytinqi, rəylər, paylaş, ⋯ menyu) |
| `/search` | `components/search/SearchPage` | `#page-search` |
| `/messages` | `components/messages/MessagesPage` | `#page-messages` |
| `/profile` | `components/profile/ProfilePage` | `#page-profile` |
| `/settings` | `components/settings/SettingsPage` | `#page-settings` + mobil `sub-panel`-lər |
| `/dev/*` | köhnə sadə şablonlar | API-ni yoxlamaq üçün (dizayn deyil) |

Bütün səhifələrdə açılan overlay-lər `components/overlays/GlobalOverlays.tsx`-də bir dəfə mount olunur:
- mağaza qeydiyyatı (9 addım, OTP, şifrə gücü, region, konfetti): `auth/StoreOnboarding`
- filtr: `overlays/FilterModal`
- yeni elan (4 addım): `overlays/ListingModal`
- məhsul hazırlat: `overlays/CreateProductModal`
- paylaş: `overlays/ShareModal`
- axtarış (mobil tam ekran + desktop panel): `search/SearchOverlay`
- məhsul detalı (qalereya, satıcı paneli, oxşar məhsullar, rəylər): `product/ProductDetailPanel`

## Quruluş
- `src/styles/` — orijinal CSS bölmələrə bölünüb (`01-base` … `14-product-detail`). Sıra vacibdir, `index.css` bu sıranı saxlayır. Sinif adları orijinaldakı kimidir, ona görə görünüş eynidir.
- `src/components/icons/` — orijinal markup-dan çıxarılmış 166 SVG ikon (avtomatik generasiya olunub).
- `src/providers/UIProvider.tsx` — qlobal UI vəziyyəti: toast, tema/dil, kateqoriya filtri, aktiv modal, məhsul detalı stack-i. Komponentlərdə `useUI()` ilə istifadə olunur.
- `src/data/` — demo data (məhsullar, reels, mesajlar, bildirişlər, parametrlər).
- `src/lib/` — auth, validasiya (Zod), filtr məntiqi (`filters.ts`), şifrə gücü (`password.ts`), məhsul detal modeli, localStorage köməkçiləri, storage abstraksiyası.
- `src/app/api/` — REST marşrutları; `prisma/` — schema + seed; `tests/` — Vitest.
- `legacy/hobbi_az_ESAS_BUDUR_SİLME_.html` — köçürmənin mənbəyi olan orijinal dizayn (köhnə `index.html`/`style.css`/`javascript.js` repo kökündəki `hobbi_az_original/`-dadır).

`localStorage` açarları: `theme`, `hobbi_lang`, `hobbi_profile`, `rating_<id>`, `pd_ad_data`, `hobbi_favorites` (bəyənilən məhsullar). `isAdmin` yalnız development-də reklam redaktəsini göstərir, production-da heç nə vermir.

URL-lər: `/?cat=resm` (kateqoriya), `/?q=xalça` (axtarış), `#producto=12` (məhsul detalı) — hamısı paylaşıla və yenilənə bilər.

## Növbəti addımlar
- Frontend-i API-yə qoşmaq: `src/data/` əvəzinə `/api/listings`, `/api/reels`, `/api/conversations`, `/api/favorites`, qeydiyyat üçün `/api/auth/*`.
- Admin, real mesajlaşma, profil redaktəsinin backend-ə yazılması.
- E-poçt/SMS OTP doğrulama, şifrə sıfırlama. Rate limit hazırda yaddaşdadır (bir server üçün); bir neçə instansda Redis/Upstash lazımdır.
- Dil seçimi (AZ/RU) yadda qalır, amma tərcümələr hələ yoxdur.
- Production şəkil saxlama: `StorageProvider` interfeysini (`src/lib/storage.ts`) S3/R2 ilə implement etmək.
