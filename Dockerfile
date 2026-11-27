# hobbi.az — production image for any server with Docker (VPS, own hosting).
# Vercel does not use this file. Build & run with docker-compose.yml (see HOSTING.md).

FROM node:22-bookworm-slim AS base
# openssl: required by the Prisma query engine
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── dependencies (postinstall runs `prisma generate`, so the schema must be present) ──
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ── one-off jobs: database migrations (compose "migrate" service) and the seed script ──
FROM deps AS migrate
# the whole source: prisma/seed.ts imports from src/ (secrets are kept out by .dockerignore)
COPY . .
CMD ["npx", "prisma", "migrate", "deploy"]

# ── build ──
FROM deps AS build
COPY . .
# NEXT_PUBLIC_* values are written into the browser code at build time, not read at runtime.
ARG NEXT_PUBLIC_SUPPORT_EMAIL=destek@hobbi.az
ENV NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL \
    NEXT_OUTPUT=standalone
RUN npx next build

# ── runtime: only the standalone server, static files and public/ ──
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/app/uploads
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
