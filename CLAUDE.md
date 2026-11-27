# hobbi.az — project guide

Azerbaijani handmade / hobby marketplace. The UI language is **Azerbaijani**; all user-facing
texts and API error messages are in Azerbaijani.

## Repository

- GitHub: `https://github.com/qurbanovvurgun-dev/hobbi.az` (branch `master`; work is pushed straight to `master` unless asked otherwise).
- Layout (this folder is the repo root):
  - `hobbi.az/` — **the app** (Next.js). Run every npm command from here.
  - `hobbi_az_original/` — the client's original static site. **Never modify it.**
  - `CLAUDE.md` (this file), `.claude/launch.json` (preview: `hobbi` on port 3000).
- Plan / checklist for going live: `hobbi.az/plan.md`. Deployment guide: `hobbi.az/DEPLOY.md`.

## Stack

Next.js 15 (App Router) · React 19 · strict TypeScript · Prisma 6 + PostgreSQL · Zod · jose (JWT
session cookie) · bcryptjs · Vitest. Production target: Vercel + Neon + Cloudflare R2 (images) +
Resend (e-mail) + Upstash Redis (rate limits). External services are called with plain `fetch`
(R2 via the tiny `aws4fetch`) — no heavy SDKs.

## Local setup

```powershell
cd hobbi.az
npm install                 # also runs prisma generate
npm run db:local            # terminal 1: local PostgreSQL on :5433 (data in .local-db/, keep running)
npm run db:deploy           # terminal 2: apply migrations
npm run db:seed             # demo stores + listings, demo buyer, local admin
npm run dev                 # http://localhost:3000
```

`.env` (git-ignored) already points at the local DB. Without a database the site still opens in
**demo mode** (built-in catalogue from `src/data/products.ts`, "Demo rejim" note on the feed).

Local accounts after seeding (passwords from `.env`):
- demo buyer: `demo-alici@demo.hobbi.invalid` / `SEED_DEMO_PASSWORD`
- demo stores: log in with the store name, e.g. `ZərgərStudio` / `SEED_DEMO_PASSWORD`
- admin: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` → `/admin`

Without `RESEND_API_KEY` the OTP code is not e-mailed: in development it appears in the UI toast
("Test rejimi: kod 123456") and in the server console. In production sign-up fails instead (by design).

## Commands (from `hobbi.az/`)

| Command | Purpose |
|---|---|
| `npm run dev` | dev server |
| `npm run typecheck` / `npm run lint` / `npm test` | checks (lint is ESLint CLI with `--max-warnings 0`) |
| `npm run test:smoke` | ~50-step API test against the running dev server (needs seeded DB, no Resend key) |
| `npm run build` | production build |
| `npm run db:local` | embedded local PostgreSQL |
| `npm run db:migrate -- --name <name>` | create a migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` / `db:seed` / `db:studio` | apply migrations / seed / browse data |

Run typecheck, lint and tests before committing. Never edit the database by hand — always a migration.

## Architecture

- `src/app/api/**/route.ts` — REST API. Every handler is wrapped in `route()` from `src/lib/http.ts`
  (same-origin check for mutations, `HttpError` → JSON `{ error }`, Zod errors → 400, DB unreachable → 503).
  Auth helpers: `requireUser()`, `requireAdmin()`; roles are re-read from the DB on every request.
- `src/lib/`
  - `auth.ts` session cookie (JWT), `otp.ts` e-mail codes (HMAC-hashed, 10 min, 5 attempts) + verification token
  - `validators.ts` all Zod schemas · `listing-query.ts` feed filters · `listing-dto.ts` DB listing → UI `Product`
  - `storage.ts` local disk or R2 (`getStorage()`) · `rate-limit.ts` memory or Upstash · `email.ts` Resend · `env.ts` boot-time env check
  - `api-client.ts` browser `api()` helper, `uploadImage()`, `timeAgo()`
- `src/providers/UIProvider.tsx` — global client state: `backend` ("online"/"offline" = demo), session `user`,
  feed (category/search in the URL: `?cat=`, `?q=`), product cache, favourites (server when signed in,
  localStorage for guests), notifications polling, modals, product panel (`#producto=<id>` deep link).
- `src/hooks/useProductActions.ts` — "Maraqlan" (message), "Sifariş et" (order), "Şikayət et" (report).
- Pages: `/` feed (infinite scroll) · `/s/[slug]` public store · `/profile` · `/messages` · `/settings` · `/admin` · `/reels` · `/search`
  · `/collections/[id]` (curated slug like `ev-dekoru`, or a user collection) · `/collections/new` (pick 8–20 listings).
- Collections: curated ones are defined by categories (`COLLECTION_CATEGORIES` in `src/data/content.ts`), user ones live in
  `Collection`/`CollectionItem` (`src/lib/collections.ts`). Search panel suggestions: recent (localStorage) + `SearchTerm` counts.
- Reels upload: `POST /api/reels/upload-url` → browser PUTs the file (R2 pre-signed URL, or `/api/reels/upload/<key>` locally)
  → `POST /api/reels`. Videos are served by `/api/media/<key>` (R2: redirect to a signed URL; local: Range streaming).
  R2 needs a CORS rule for browser PUTs (DEPLOY.md).
- Messages: "delete chat" is per user (`ConversationParticipant.hiddenAt`); the filter sheet opens on top of the current overlay
  (`filterOpen` in UIProvider, separate from `modal`).
- `prisma/schema.prisma` — User, Store, OtpCode, Category, Listing(+Image), Upload, Favorite, Review, Order,
  Conversation/Participant/Message, Reel*, Report. Category slugs match the UI: `keramika, resm, zergerllik,
  toxuculuq, agac, musiqi, digər`.

## Conventions

- The design is a port of `hobbi.az/legacy/hobbi_az_ESAS_BUDUR_SİLME_.html`: CSS lives in `src/styles/` with the
  **original class names** — reuse them instead of inventing new styles. Icons: `src/components/icons/index.tsx`.
- Product ids are strings (DB cuid); offline demo products use `demo-N`.
- Clickable non-button elements get `{...pressable}` from `src/lib/a11y.ts` (put `key` before the spread).
- New API input → schema in `validators.ts`; new listing fields → also `listing-dto.ts` and the `Product` type.
- Secrets only in `.env` (local) or Vercel env vars — never in code, commits or chat.

## Windows notes

- Stop the dev server before `prisma generate` (it locks the query-engine DLL → EPERM).
- Testing the API with `curl` mangles Azerbaijani characters on Windows — use Node `fetch` (see `scripts/smoke-test.mjs`).

## Status (2026-11)

Done: full UI port; real backend (OTP sign-up, stores, listings with photo upload, search, favourites, reviews,
orders, messages, notifications, reports, admin); production-ready infrastructure code.
Not live yet: accounts (Neon, Vercel, R2, Resend, Upstash) and the domain — owner's checklist in `hobbi.az/plan.md`.
Done 2026-11-26: collections (curated + user-made), reels video upload + real feed, photo lightbox, messages split view /
delete-for-me / bulk message, desktop layout fixes (`.main-wrap` width). Migration `20261126000000_collections_search_hide_chat`.
Not built yet: SMS OTP, online payment, Russian translations, real-time chat, listing editing, `next/image`.
