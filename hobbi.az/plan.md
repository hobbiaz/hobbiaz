# hobbi.az: iş planı

## Hazırkı vəziyyət

- **Hazır kod:** frontend (React/Next.js) və backend (API, Prisma, PostgreSQL). Commit `524d36d`, `master` branch-da.
- **İşləyən funksiyalar:**
  - qeydiyyat e-poçt kodu ilə, giriş, şifrə bərpası;
  - mağaza yaratmaq, şəkilli elan yerləşdirmək;
  - axtarış və filtrlər;
  - sevimlilər, rəylər;
  - sifarişlər, mesajlar, bildirişlər;
  - şikayətlər və admin paneli.
- **Lokal yoxlama:** typecheck, lint, 41 test və production build keçir. Tam axın lokal bazada interfeys üzərindən sınanıb.
- **Baza olmadan:** sayt "demo rejim"də açılır və nümunə məhsullar göstərir.
- **Hələ edilməyib:** sayt canlıda deyil. Xidmət hesabları açılmayıb, e-poçt xidməti qoşulmayıb.

> ⚠️ Açarları (API key, şifrə, connection string) heç vaxt git-ə və çata yazmayın. Onlar yalnız Vercel → Settings → Environment Variables bölməsində və lokal `.env` faylında saxlanır (`.env` git-ə düşmür).

---

## A. Sizin addımlarınız: saytı canlıya çıxarmaq

Hər addımı bitirəndə `[ ]` işarəsini `[x]` edin. Ətraflı izah: [DEPLOY.md](DEPLOY.md).

### 1. Domen
- [ ] `hobbi.az` domeni sizdədirsə, onu hansı şirkətin panelindən idarə etdiyinizi tapın (DNS qeydləri orada yazılacaq).
- [ ] Domen yoxdursa, `.az` domeni satan şirkətdən alın. Domen gələnə qədər sayt `xxx.vercel.app` ünvanında işləyəcək. E-poçt üçün bu müddətdə Gmail variantı lazımdır (bax: B bölməsi).

### 2. Neon: verilənlər bazası (~5 dəq)
- [ ] neon.tech saytında GitHub ilə daxil olun.
- [ ] **New project** yaradın: ad `hobbi-az`, region **AWS Europe Central (Frankfurt)**.
- [ ] **Connect** bölməsindən iki sətir götürün:
  - **Pooled** (ünvanda `-pooler` var) → `DATABASE_URL`
  - pooling söndürülmüş variant → `DIRECT_URL`

### 3. Cloudflare R2: şəkillər (~5 dəq)
- [ ] dash.cloudflare.com → **R2** → **Create bucket** → `hobbi-media`. Bucket public olmamalıdır.
- [ ] **Manage API tokens** → **Create token**: icazə *Object Read & Write*, yalnız `hobbi-media` bucket-ı.
- [ ] Bu dəyərləri saxlayın:
  - Account ID → `R2_ACCOUNT_ID`
  - Access Key ID → `R2_ACCESS_KEY_ID`
  - Secret → `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET` = `hobbi-media`

### 4. Resend: e-poçt kodları (~10 dəq + DNS)
- [ ] resend.com → **API Keys** → **Create** → `RESEND_API_KEY`.
- [ ] **Domains** → **Add** → `hobbi.az`. Göstərilən DNS qeydlərini (TXT, MX) domen panelinə yazın və **Verify** basın.
- [ ] `EMAIL_FROM` = `hobbi.az <noreply@hobbi.az>`
- Qeyd: domen təsdiqlənənə qədər Resend yalnız sizin öz e-poçtunuza göndərir.

### 5. Upstash: sorğu limiti (~3 dəq)
- [ ] upstash.com → **Create database** → Redis, region **Frankfurt (eu-central-1)**.
- [ ] **REST API** bölməsindən iki dəyər:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

### 6. Vercel: sayt (~10 dəq)
- [ ] vercel.com saytında GitHub ilə daxil olun → **Add New → Project** → `qurbanovvurgun-dev/hobbi.az` reposunu seçin.
  - Repo görünmürsə, repo sahibi Vercel GitHub App-a icazə verməlidir.
- [ ] **Root Directory** = `hobbi.az`. Bu vacibdir, çünki repoda iki qovluq var.
- [ ] **Environment Variables** bölməsinə yuxarıdakı bütün dəyərləri əlavə edin, üstəlik bunları:
  - `AUTH_SECRET`: bu əmrin çıxışı:
    ```powershell
    node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
    ```
  - `APP_ORIGIN`: əvvəlcə `https://<layihə>.vercel.app`, domen qoşulandan sonra `https://hobbi.az`.
  - `NEXT_PUBLIC_SUPPORT_EMAIL`: dəstək e-poçtu.
- [ ] **Deploy** basın. Build zamanı baza cədvəlləri avtomatik yaradılır (`vercel-build` skripti).
- [ ] Plan: satış saytı kommersiya layihəsidir, ona görə Vercel **Pro** lazımdır (~$20/ay).

### 7. Demo məhsullar və admin hesabı (bir dəfə, ~5 dəq)
- [ ] Layihə qovluğunda `.env.example` faylını `.env` adı ilə kopyalayın.
- [ ] İçinə Neon-un iki sətrini, `AUTH_SECRET`-i və bunları yazın:
  - `SEED_DEMO_PASSWORD`: istənilən şifrə
  - `SEED_ADMIN_EMAIL`: öz e-poçtunuz
  - `SEED_ADMIN_PASSWORD`: güclü şifrə
- [ ] Bu əmrləri işlədin:
  ```powershell
  npm install
  ```
  ```powershell
  npm run db:seed
  ```

### 8. Domeni qoşmaq (~10 dəq + DNS-in yayılmasını gözləmək)
- [ ] Vercel → **Settings → Domains** → `hobbi.az` və `www.hobbi.az` əlavə edin.
- [ ] Vercel-in göstərdiyi DNS qeydlərini domen panelində yazın.
- [ ] `APP_ORIGIN` dəyərini `https://hobbi.az` edin və **Redeploy** basın.

### 9. Yoxlama
- [ ] `https://hobbi.az/api/health` → `"ok":true`. `services` bölməsində `r2`, `upstash`, `resend` yazılmalıdır.
- [ ] "Mağaza Aç" → e-poçta kod gəlir → mağaza yaranır.
- [ ] Profil → "Yeni elan" → şəkil yüklənir → elan ana səhifədə görünür.
- [ ] Başqa hesabla: "Maraqlan" mesaj göndərir, "Sifariş et" satıcıya bildiriş və e-poçt göndərir.
- [ ] Admin e-poçtu ilə daxil olun → `/admin` açılır.

---

## B. Qərar gözləyənlər

- [ ] **Domen yoxdursa:** kodları müvəqqəti Gmail SMTP ilə göndərmək (domensiz işləyir, gündə ~500 məktub). Bunun üçün kodu Claude əlavə edəcək.
- [ ] **SMS ilə kod:** yerli Azərbaycan SMS provayderini seçmək.
- [ ] **Onlayn ödəniş:** bank və ya ödəniş provayderini seçmək. Hazırda sifariş "razılaşma ilə" işləyir.

## C. Növbəti inkişaf (Claude edəcək)

1. Gmail SMTP və ya SMS ilə kod göndərmə (B bölməsindəki qərardan asılıdır).
2. Reels: video yükləmə (R2) və real lent. Hazırda reels demo datadır.
3. Rus dili: tərcümə sistemi (i18n).
4. Mesajlar: canlı yenilənmə (SSE). Hazırda yeni mesajlar 5 saniyədə bir yoxlanılır.
5. Şəkillərin `next/image` ilə optimallaşdırılması.
6. Elanı redaktə etmək: başlıq, qiymət və şəkilləri profildən dəyişmək.
7. Monitorinq: xətaların izlənməsi (Sentry) və uptime yoxlaması (`/api/health`).
8. Onlayn ödəniş (B bölməsindəki qərardan sonra).

## D. Faydalı əmrlər

```powershell
npm run dev          # lokal sayt: http://localhost:3000
```
```powershell
npm run typecheck; npm run lint; npm test   # yoxlamalar
```
```powershell
npm run db:migrate -- --name <ad>   # sxem dəyişəndə yeni migration
```
```powershell
npm run db:local     # lokal PostgreSQL (ayrı terminalda açıq saxlayın)
```
```powershell
npm run db:studio    # bazaya brauzerdə baxmaq
```
```powershell
npm run test:smoke   # API axınının tam yoxlanışı (dev server açıq olmalıdır)
```

Bütün əmrlər `hobbi.az` (tətbiq) qovluğundan işlədilir. Layihə haqqında texniki məlumat: repo kökündəki `CLAUDE.md`.
