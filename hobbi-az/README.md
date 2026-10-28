# hobbi.az — Next.js + Prisma + PostgreSQL

Azərbaycan hobbi/əl işi bazarı. Stack: Next.js 15 (App Router), React 19, strict TypeScript, Prisma, PostgreSQL, Zod, jose (JWT cookie sessiyası) + bcryptjs, Vitest.

> **Status: kod yazılıb, lakin bu mühitdə quraşdırılıb işə salınmayıb.** Şəbəkə bağlı olduğu üçün `npm install`, `prisma migrate`, `next build`, lint və testlər icra EDİLMƏYİB. Aşağıdakı addımları öz maşınınızda işlədin və çıxan xətaları düzəldin.

## Quraşdırma
```bash
cp .env.example .env        # DATABASE_URL, AUTH_SECRET, SEED_DEMO_PASSWORD doldurun
npm install
npx prisma migrate dev --name init   # migrasiya faylı ilk dəfə burada yaranır (prisma/migrations/)
npm run db:seed
npm run dev                 # http://localhost:3000
```
Yoxlamalar: `npm run typecheck && npm run lint && npm test && npm run build`

## Mühit dəyişənləri
`DATABASE_URL`, `AUTH_SECRET` (32+ simvol), `APP_ORIGIN`, `UPLOAD_DIR`, `SEED_DEMO_PASSWORD`, `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (admin yalnız ikisi də verilərsə yaranır; kodda admin parolu yoxdur).

## Quruluş
- `legacy/` — orijinal `index.html`, `javascript.js`, `style.css`, `hobbi_az_ESAS_BUDUR_SİLME_.html` (toxunulmayıb)
- `prisma/` — schema + seed (demo qeydlər `isDemo=true`, adları `[DEMO]`)
- `src/lib/` — auth, validasiya (Zod), filtr sorğusu, şəkil yoxlaması, storage abstraksiyası
- `src/app/api/` — REST marşrutları; `src/app/` — səhifələr; `tests/` — Vitest

## Hazır olanlar (kod səviyyəsində)
Qeydiyyat/giriş/çıxış (bcrypt + httpOnly JWT cookie, rol hər sorğuda DB-dən oxunur), elan CRUD (sahibi/admin), qaralama/dərc, axtarış/kateqoriya/qiymət/sıralama/səhifələmə, elan səhifəsi (`/listings/[id]`), seçilmişlər (DB), şəkil yükləmə (magic-byte yoxlaması, 5 MB, fayl sistemində), şikayət, admin moderasiya API (`PATCH /api/admin/listings/:id`, `GET /api/admin/reports`), mesajlaşma API (iştirakçı yoxlaması, **real-time deyil**), Reels (DB siyahısı, yalnız görünən video oynayır, bəyənmə, şərh API), CSRF üçün Origin yoxlaması.

## Hələ görülməyib
- **Orijinal dizaynın tam React-a köçürülməsi.** Hazırda `style.css` import olunub (dəyişənlər/şriftlər), amma səhifələr sadə şablondur; 330 KB `index.html` komponentlərə bölünməyib.
- Admin, mesajlar, profil redaktəsi, elan redaktəsi, Reels yükləmə üçün **UI yoxdur** (yalnız API).
- Rate limiting, e-poçt/SMS doğrulama, şifrə sıfırlama yoxdur (SMS provayderi tələb edir).
- Satıcı reytinqi/rəy modeli yoxdur (saxta rəqəm göstərilmir).
- Demo reel `/demo/sample.mp4` faylı layihədə yoxdur — `public/demo/` altına qoyun.
- Production şəkil saxlama: `StorageProvider` interfeysini (`src/lib/storage.ts`) S3/R2 ilə implement edin.
