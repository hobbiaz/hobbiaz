# hobbi.az: hostinq və köçürmə təlimatı

Sayt üç müstəqil hissədən ibarətdir. Hər biri ayrıca köçürülə bilər:

| Hissə | Nədir | Harada ola bilər |
|---|---|---|
| **Tətbiq** | Next.js server (`src/`) | Vercel, ya da Docker ilə istənilən server (VPS) |
| **Baza** | PostgreSQL (elanlar, istifadəçilər, mesajlar…) | Neon, istənilən managed PostgreSQL, ya da serverin özündə (Docker) |
| **Fayllar** | Şəkillər və videolar | Cloudflare R2, ya da serverin diski |

Tətbiq bazanı yalnız `DATABASE_URL` / `DIRECT_URL` ilə tanıyır, fayl yerini isə `R2_*` (boşdursa disk) ilə.
Hostinqi dəyişmək = məlumatı köçürmək + bu dəyişənləri yeni yerə yazmaq. Kodda heç nə dəyişmir.

Qızıl qaydalar:
1. **Baza yalnız migration ilə dəyişir** (`npm run db:migrate` → commit → hər yerdə `npm run db:deploy`). Əl ilə dəyişiklik köçürmədə sürpriz yaradır.
2. **PostgreSQL versiyası:** lokal 18-dir. Yeni hostinqdə də 18 (və ya daha yeni) seçin; ehtiyat nüsxəni yalnız eyni və ya **daha yeni** versiyaya bərpa etmək olar.
3. **Fayllar üçün R2 tövsiyə olunur:** onda server köçəndə şəkillər/videolar yerində qalır, köçürmək lazım gəlmir.
4. **Gizli açarlar** (`.env`, `.env.production`) heç vaxt git-ə düşmür.

---

## A. Vercel + Neon + R2 (hazırkı plan)

Addımlar `plan.md` (A bölməsi) və `DEPLOY.md`-dədir. Server idarə etmək lazım deyil.

## B. Öz server (VPS) — Docker ilə

Lazım olan: Ubuntu 22.04/24.04 server (ən azı 2 GB RAM), domen, serverdə Docker.

```bash
# 1. Docker (bir dəfə)
curl -fsSL https://get.docker.com | sh

# 2. Kod
git clone https://github.com/hobbiaz/hobbiaz.git /opt/hobbi
cd /opt/hobbi

# 3. Ayarlar: faylı açıb doldurun (POSTGRES_PASSWORD, AUTH_SECRET, DOMAIN, APP_ORIGIN, RESEND_…)
cp .env.production.example .env.production
nano .env.production

# 4. Domenin A qeydi bu serverin IP-sinə yönəlsin, sonra:
docker compose --env-file .env.production --profile https up -d --build
```

Nə baş verir: PostgreSQL 18 qalxır → `migrate` xidməti cədvəlləri qurur → sayt işə düşür →
Caddy HTTPS sertifikatını özü alır. Yoxlama: `https://<domen>/api/health` → `"ok":true`.

Hostinqin öz proxy/HTTPS-i varsa `--profile https` yazmayın; sayt serverdə `127.0.0.1:3000`-dədir.

Faydalı əmrlər (hamısı `/opt/hobbi`-də):

```bash
docker compose --env-file .env.production logs -f app          # loqlar
git pull && docker compose --env-file .env.production --profile https up -d --build   # yeniləmə (migration-lar da işləyir)
docker compose --env-file .env.production run --rm \
  -e SEED_DEMO_PASSWORD=... -e SEED_ADMIN_EMAIL=... -e SEED_ADMIN_PASSWORD=... \
  migrate npx tsx prisma/seed.ts                               # demo məlumat + admin (bir dəfə)
```

**Başqa (xarici) baza istifadə etmək:** `docker-compose.yml`-də `app` və `migrate` xidmətlərindəki
`DATABASE_URL` / `DIRECT_URL` dəyərlərini xarici bazanın ünvanı ilə əvəz edin və `db` xidmətini silin.

---

## C. Bazanın ehtiyat nüsxəsi və köçürülməsi

### Kompüterdən / Neon-dan: `npm run db:backup` və `npm run db:restore`

Lazım olan: PostgreSQL **Command Line Tools** (pg_dump, pg_restore), bazanın versiyası və ya daha yenisi.
Windows: https://www.postgresql.org/download/windows/ — quraşdırarkən yalnız "Command Line Tools" seçmək kifayətdir.

```powershell
# Ehtiyat nüsxə: .env-dəki bazadan (DIRECT_URL, yoxdursa DATABASE_URL) → backups\hobbi_az-<tarix>.dump
npm run db:backup

# Bərpa: .env-dəki bazaya (təsdiq soruşur; mövcud cədvəllər fayldakılarla əvəz olunur)
npm run db:restore -- backups\hobbi_az-2026-11-27-10-00-00.dump
npm run db:deploy        # kod nüsxədən yenidirsə, çatışmayan migration-ları tətbiq edir
```

Neon-dan nüsxə almaq üçün `.env`-də müvəqqəti olaraq Neon-un **pooling söndürülmüş** ünvanını yazın
(və ya `DIRECT_URL="..." npm run db:backup`).

### Docker serverində

```bash
cd /opt/hobbi
# nüsxə → ./backups/
docker compose --env-file .env.production exec -T db pg_dump -U hobbi -Fc hobbi_az > backups/hobbi_az-$(date +%F).dump
# bərpa (başqa yerdən gətirilmiş fayl)
docker compose --env-file .env.production exec -T db pg_restore -U hobbi -d hobbi_az --clean --if-exists --no-owner --single-transaction < backups/fayl.dump
```

Hər gecə avtomatik nüsxə (14 gün saxlanır) — `crontab -e`:

```cron
0 3 * * * cd /opt/hobbi && docker compose --env-file .env.production exec -T db pg_dump -U hobbi -Fc hobbi_az > backups/hobbi_az-$(date +\%F).dump && find backups -name '*.dump' -mtime +14 -delete
```

Nüsxələri serverdən kənarda da saxlayın (məs. R2-yə və ya öz kompüterinizə yükləyin): server sıradan çıxsa, nüsxələr də onunla gedər.

### Bir hostinqdən digərinə köçürmə (məs. Neon → öz server)

1. Yeni yerdə saytı qurun (B), amma DNS-i hələ dəyişməyin.
2. Köhnə bazadan nüsxə: `npm run db:backup` (və ya Docker əmri).
3. Faylı yeni serverə köçürün: `scp backups/fayl.dump root@<server>:/opt/hobbi/backups/`
4. Yeni bazaya bərpa edin (yuxarıdakı Docker əmri), sonra `https://<yeni-server>/api/health` yoxlayın.
5. Fayllar: R2 istifadə edirsinizsə heç nə etmək lazım deyil. Diskdədirsə, aşağıdakı kimi köçürün.
6. Saytı qısa müddət bağlı saxlayıb (yeni məlumat yazılmasın) son nüsxəni bir də alın və bərpa edin.
7. DNS-i yeni serverə yönəldin.

### Fayllar diskdədirsə (R2 yoxdur)

```bash
# köhnə serverdə: uploads volume-u arxivə
docker run --rm -v hobbi_uploads:/data -v "$PWD":/out alpine tar czf /out/uploads.tgz -C /data .
# yeni serverdə: arxivi volume-a aç
docker run --rm -v hobbi_uploads:/data -v "$PWD":/in alpine tar xzf /in/uploads.tgz -C /data
```

Lokal kompüterdə fayllar `uploads/` qovluğundadır; onu da eyni arxivlə köçürmək olar.

---

## Mühit dəyişənləri

| Dəyişən | Vacib | Qeyd |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | bəli | Neon: pooled / direct. Docker: compose özü qurur |
| `AUTH_SECRET` | bəli | 32+ simvol, dəyişsə hamı çıxış edir |
| `APP_ORIGIN` | canlıda | `https://hobbi.az` |
| `RESEND_API_KEY`, `EMAIL_FROM` | canlıda | qeydiyyat kodları |
| `R2_*` | Vercel-də bəli | boşdursa fayllar diskə (`UPLOAD_DIR`) |
| `UPSTASH_*` | yox | bir neçə server/instans olanda |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | yox | build zamanı koda yazılır |
| `POSTGRES_PASSWORD`, `DOMAIN` | Docker | yalnız `.env.production` |
