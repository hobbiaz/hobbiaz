// Helpers shared by db-backup.mjs and db-restore.mjs.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Prisma accepts extra query parameters that pg_dump / pg_restore (libpq) reject
 * ("invalid URI query parameter"). Keep only the ones libpq understands.
 */
const PRISMA_ONLY = new Set(["schema", "pgbouncer", "connection_limit", "pool_timeout", "socket_timeout", "statement_cache_size", "connect_timeout_ms"]);
export function toLibpqUrl(raw) {
  const url = new URL(raw);
  for (const key of [...url.searchParams.keys()]) if (PRISMA_ONLY.has(key)) url.searchParams.delete(key);
  return url.toString();
}

/** "user@host:port/db" without the password, for messages. */
export function describeUrl(raw) {
  const u = new URL(raw);
  return `${u.username || "?"}@${u.hostname}${u.port ? ":" + u.port : ""}${u.pathname}`;
}

/** The connection to use: DIRECT_URL (Neon: not pooled) or DATABASE_URL. */
export function databaseUrl() {
  const raw = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!raw) fail("DATABASE_URL / DIRECT_URL tapılmadı (.env faylını yoxlayın).");
  return raw;
}

/**
 * Finds a PostgreSQL client tool (pg_dump / pg_restore): PG_BIN, then PATH,
 * then the default Windows install folders (newest version first).
 */
export function findTool(name) {
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  const candidates = [];
  if (process.env.PG_BIN) candidates.push(path.join(process.env.PG_BIN, exe));
  candidates.push(exe);
  if (process.platform === "win32") {
    const base = "C:\\Program Files\\PostgreSQL";
    if (existsSync(base)) {
      for (const v of readdirSync(base).sort((a, b) => Number(b) - Number(a))) candidates.push(path.join(base, v, "bin", exe));
    }
  }
  for (const c of candidates) {
    const r = spawnSync(c, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return { path: c, version: r.stdout.trim() };
  }
  fail(
    `${name} tapılmadı. PostgreSQL "Command Line Tools" quraşdırın (bazanın versiyası ilə eyni və ya daha yeni, məs. 18):\n` +
      "  Windows: https://www.postgresql.org/download/windows/ (quraşdırarkən yalnız \"Command Line Tools\" seçmək kifayətdir)\n" +
      "  Ubuntu/Debian: sudo apt install postgresql-client\n" +
      "Başqa qovluqdadırsa: PG_BIN=<bin qovluğu> mühit dəyişənini verin.",
  );
}

export function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}
