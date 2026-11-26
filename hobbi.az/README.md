# hobbi.az: Next.js + Prisma + PostgreSQL

Azərbaycan əl işi və hobbi bazarı. Stack: Next.js 15 (App Router), React 19, strict TypeScript, Prisma 6, PostgreSQL, Zod, jose (JWT cookie sessiyası), bcryptjs, Vitest.

Dizayn `legacy/hobbi_az_ESAS_BUDUR_SİLME_.html`-dən React komponentlərinə köçürülüb və tam olaraq API/bazaya bağlıdır:
- mağaza qeydiyyatı (e-poçt OTP);
- giriş və şifrə bərpası;
- elan yerləşdirmə (şəkil yükləmə ilə);
- axtarış və filtrlər;
- sevimlilər, rəylər və ulduz reytinqi;
- sifarişlər (satıcı qəbul edir və ya rədd edir);
- mesajlaşma, bildirişlər;
- şikayətlər və admin paneli.

**Canlıya çıxarmaq:** [DEPLOY.md](DEPLOY.md) (Neon, Vercel, Cloudflare R2, Resend, Upstash, domen).

## Lokal işə salmaq

```bash
npm install
npm run dev                 # http://localhost:3000
```

- **Baza olmadan:** sayt açılır və **demo rejimdə** işləyir (nümunə məhsullar, yuxarıda "Demo rejim" qeydi). Qeydiyyat, sifariş və mesajlar üçün baza lazımdır.
- **Lokal baza ilə (Docker və ya quraşdırma lazım deyil):**
  1. `.env.example`-ı `.env`-ə kopyalayın və `DATABASE_URL`/`DIRECT_URL` sahələrinə `postgresql://hobbi:hobbi_local_dev@localhost:5433/hobbi_az?schema=public` yazın. `AUTH_SECRET` də doldurulmalıdır.
  2. Əmrləri işlədin:

```bash
npm run db:local            # 1-ci terminal: PostgreSQL :5433 portunda (data .local-db/ qovluğunda), açıq saxlayın
npm run db:deploy           # 2-ci terminal: cədvəllər (prisma/migrations)
npm run db:seed             # 7 demo mağaza, 10 məhsul, demo alıcı (+ admin)
npm run dev
```

- **Neon ilə:** lokal baza əvəzinə `.env`-ə Neon `dev` branch-ın string-lərini yazın. `db:local`-a ehtiyac qalmır.
- **Məlumatlara baxmaq:** `npm run db:studio` bazanı brauzerdə açır.
- **API smoke test:** dev server və seed edilmiş baza işləyərkən `npm run test:smoke` təxminən 50 yoxlama aparır.

**Development-də OTP:** `RESEND_API_KEY` yoxdursa, təsdiq kodu e-poçta getmir. Kod ekranda "Test rejimi: kod 123456" kimi və server konsolunda görünür.

**Yoxlamalar:** `npm run typecheck && npm run lint && npm test && npm run build`

## Səhifələr

| Route | Nə edir |
|---|---|
| `/` | Lent: kateqoriya (`?cat=resm`), axtarış (`?q=xalça`), "Daha çox", məhsul detalı (`#producto=<id>`) |
| `/s/<slug>` | Mağazanın public səhifəsi (paylaşılan link) |
| `/profile` | Mağazam: elanlarım (dərc et/gizlət/sil), sevimlilər, gələn sifarişlər / sifarişlərim |
| `/messages` | Söhbətlər + yazışma (`?c=<id>`), 5 saniyədə bir yenilənir |
| `/settings` | Hesab məlumatları, tema, dil, çıxış |
| `/admin` | Statistika, şikayətlər, moderasiya (yalnız `role=ADMIN`) |
| `/reels`, `/search` | Dizayn səhifələri (reels hələ demo datadır) |

## API (qısa)

| Bölmə | Endpoint-lər |
|---|---|
| Giriş və hesab | `POST /api/auth/otp`, `/api/auth/otp/verify`, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/password-reset` |
| Profil | `GET/PATCH /api/me` |
| Mağaza | `POST/PATCH /api/store`, `GET /api/stores/check?name=`, `GET /api/stores/<slug>` |
| Elanlar | `GET/POST /api/listings` (`?owner=me`), `GET/PATCH/DELETE /api/listings/<id>`, `GET/POST/PATCH /api/listings/<id>/reviews` |
| Fayllar | `POST /api/upload`, `GET /api/media/<key>` |
| Sevimlilər | `GET/POST /api/favorites` |
| Sifarişlər | `GET/POST /api/orders`, `PATCH /api/orders/<id>` |
| Mesajlar | `GET/POST /api/conversations`, `GET/POST /api/conversations/<id>/messages` |
| Bildirişlər | `GET/POST /api/notifications` |
| Şikayət və admin | `POST /api/reports`, `GET /api/admin/stats`, `GET /api/admin/reports`, `PATCH /api/admin/reports/<id>`, `PATCH /api/admin/listings/<id>` |
| Nəzarət | `GET /api/health` (uptime yoxlaması) |

Təhlükəsizlik:
- Bütün dəyişdirən sorğular üçün same-origin yoxlaması.
- Sessiya httpOnly JWT cookie-də saxlanır, rol hər dəfə bazadan oxunur.
- Şifrələr bcrypt ilə saxlanır.
- OTP kodunun yalnız HMAC-ı saxlanır, 10 dəqiqə etibarlıdır, 5 cəhd limiti var.
- Sorğu limitləri (Upstash və ya yaddaş).
- Şəkil tipi magic bytes ilə yoxlanır.
- Təhlükəsizlik başlıqları.

## Quruluş

- `src/providers/UIProvider.tsx`: qlobal vəziyyət:
  - sessiya;
  - API və demo rejimi (`backend`);
  - lent, keş, sevimlilər;
  - bildirişlər;
  - modallar, məhsul paneli.
- `src/lib/`: server və client köməkçiləri:
  - `auth`, `otp`, `email` (Resend);
  - `storage` (lokal disk və ya R2), `rate-limit` (yaddaş və ya Upstash), `env` (başlanğıcda yoxlama);
  - `listing-dto` (bazadakı elanı UI `Product` formatına çevirir);
  - `api-client`, `validators`.
- `src/hooks/useProductActions.ts`: "Maraqlan", "Sifariş et", "Şikayət et".
- `src/styles/`: orijinal CSS bölmələrə bölünüb. Sinif adları orijinaldakı kimidir.
- `src/data/`: offline demo kataloqu (həm də seed üçün mənbə).
- `prisma/`: sxem, migration-lar, seed.

Sxemi dəyişəndə `npm run db:migrate -- --name <ad>` yeni migration yaradır. Bazanı əl ilə dəyişməyin.

## Hələ edilməyənlər

- SMS ilə OTP: telefon nömrəsi saxlanılır, kod isə e-poçtla gəlir. Yerli SMS provayderi seçiləndə əlavə olunacaq.
- Onlayn ödəniş: sifariş hələlik "razılaşma ilə" işləyir.
- Reels: video yükləmə yoxdur, səhifə demo datadır.
- Rus dili: seçim yadda qalır, tərcümələr yoxdur.
- Real-time mesajlar: indi polling işləyir, SSE/WebSocket yoxdur.
- Şəkillərin `next/image` ilə optimallaşdırılması.
