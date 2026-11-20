# hobbi.az: canlıya çıxarmaq (Neon + Vercel + R2 + Resend + Upstash)

Kod hazırdır. Aşağıdakı addımlar hesab, ödəniş və DNS tələb edir, ona görə onları sahib özü edir. Hər addımın sonunda **hansı dəyəri haraya yazacağınız** göstərilib. Açarları heç vaxt git-ə və çata yazmayın: yalnız Vercel → *Settings → Environment Variables* bölməsinə və lokal `.env` faylına.

## 1. Neon (PostgreSQL), ~5 dəqiqə
1. https://neon.tech → GitHub ilə daxil olun → **New project**: ad `hobbi-az`, region **AWS Europe Central (Frankfurt)**, Postgres 17.
2. **Connection details** bölməsində iki string götürün:
   - **Pooled connection** (hostda `-pooler` var) → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`
3. (İstəyə bağlı) `dev` adlı branch yaradın: lokal iş üçün onun string-lərini `.env`-ə yazın, `main` branch-ı isə production üçün saxlayın.

## 2. Cloudflare R2 (şəkillər), ~5 dəqiqə
1. https://dash.cloudflare.com → **R2** → **Create bucket**: `hobbi-media` (location: Automatic / EU).
2. **R2 → Manage API tokens → Create API token**: icazə *Object Read & Write*, yalnız `hobbi-media` bucket-ı.
3. Dəyərlər: `R2_ACCOUNT_ID` (dashboard-un sağında "Account ID"), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=hobbi-media`.
   Bucket public olmamalıdır: şəkillər `/api/media/...` vasitəsilə verilir.

## 3. Resend (e-poçt, OTP kodları), ~10 dəqiqə + DNS
1. https://resend.com → **API Keys → Create** → `RESEND_API_KEY`.
2. **Domains → Add domain** → `hobbi.az`. Resend-in göstərdiyi DNS qeydlərini (SPF `TXT`, DKIM `TXT`/`CNAME`, MX) domenin DNS bölməsinə əlavə edin və **Verify** basın.
3. `EMAIL_FROM="hobbi.az <noreply@hobbi.az>"`.
   Domen təsdiqlənənə qədər Resend yalnız öz e-poçtunuza göndərir. Bu, test üçün kifayətdir.

## 4. Upstash Redis (sorğu limiti), ~3 dəqiqə
1. https://upstash.com → **Create database** → Redis, region **eu-central-1 (Frankfurt)**.
2. **REST API** bölməsindən: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## 5. Vercel (sayt + API), ~10 dəqiqə
1. https://vercel.com → GitHub ilə daxil olun → **Add New → Project** → `qurbanovvurgun-dev/hobbi.az` reposunu import edin.
   (Repo başqasının hesabındadırsa, repo sahibi Vercel GitHub App-a icazə verməlidir.)
2. **Root Directory**: `hobbi.az` (vacibdir: repoda iki qovluq var).
3. Framework: Next.js (avtomatik). Build command dəyişməyin: `package.json`-dakı `vercel-build` özü işə düşür (`prisma generate → prisma migrate deploy → next build`), yəni baza cədvəlləri hər deploy-da avtomatik yenilənir.
4. **Environment Variables** (Production + Preview):

   | Ad | Dəyər |
   |---|---|
   | `DATABASE_URL`, `DIRECT_URL` | Neon (addım 1) |
   | `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
   | `APP_ORIGIN` | əvvəlcə `https://<layihə>.vercel.app`, domen qoşulandan sonra `https://hobbi.az` |
   | `RESEND_API_KEY`, `EMAIL_FROM` | addım 3 |
   | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | addım 2 |
   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | addım 4 |
   | `NEXT_PUBLIC_SUPPORT_EMAIL` | dəstək e-poçtu |
5. **Deploy**. Sonra `https://<layihə>.vercel.app/api/health` açın: `{"ok":true,"database":true,...}` görməlisiniz. `services` bölməsində `r2`, `upstash`, `resend` yazılmalıdır.
6. Plan: Vercel-in pulsuz **Hobby** planı qeyri-kommersiya üçündür. Satış saytı üçün **Pro** lazımdır.

## 6. Demo məhsullar və admin (bir dəfə)
Lokal kompüterdə, `.env`-də **production** Neon string-ləri ilə:
```bash
npm run db:deploy      # cədvəllər (Vercel artıq edibsə, "No pending migrations")
npm run db:seed        # 7 demo mağaza + 10 məhsul + demo alıcı (+ admin, əgər SEED_ADMIN_* verilibsə)
```
Demo mağazalar `isDemo=true` ilə işarələnir. Real satıcılar gələndə onları admin paneldən silmək olar.

## 7. Domen: hobbi.az
1. Vercel → Project → **Settings → Domains** → `hobbi.az` və `www.hobbi.az` əlavə edin.
2. Vercel-in göstərdiyi DNS qeydlərini domeni aldığınız şirkətin panelində yazın (adətən kök domen üçün `A` qeydi, `www` üçün `CNAME`; dəqiq dəyərləri Vercel ekranından götürün).
3. SSL avtomatikdir. Bitəndən sonra `APP_ORIGIN=https://hobbi.az` edin və **Redeploy** basın.

## Yoxlama siyahısı (canlıda)
- [ ] `/api/health` → `ok: true`
- [ ] "Mağaza Aç" → e-poçta kod gəlir → mağaza yaranır
- [ ] Profil → "Yeni elan" → şəkil yüklənir (R2) → ana səhifədə görünür
- [ ] Başqa hesabla: Maraqlan → mesaj, Sifariş et → satıcıya e-poçt + bildiriş
- [ ] `/admin` (admin hesabı ilə) açılır
