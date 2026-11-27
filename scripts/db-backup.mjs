// Database backup: one portable file you can restore on any PostgreSQL host.
// Usage:  npm run db:backup            → backups/hobbi_az-<date>.dump
//         npm run db:backup -- <file>  → a file name of your choice
// Needs pg_dump (PostgreSQL client tools) of the same major version as the server or newer.
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { databaseUrl, describeUrl, fail, findTool, toLibpqUrl } from "./db-url.mjs";

const url = databaseUrl();
const pgDump = findTool("pg_dump");
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
const out = path.resolve(process.argv[2] ?? path.join("backups", `hobbi_az-${stamp}.dump`));
mkdirSync(path.dirname(out), { recursive: true });

console.log(`Baza: ${describeUrl(url)}\n${pgDump.version}\nFayl: ${out}\n`);
// custom format: compressed, restorable table by table with pg_restore;
// no owner / privileges so it restores into a database with a different user.
const r = spawnSync(pgDump.path, ["--format=custom", "--no-owner", "--no-privileges", "--file", out, "--dbname", toLibpqUrl(url)], { stdio: "inherit" });
if (r.status !== 0) {
  fail("pg_dump uğursuz oldu. \"server version mismatch\" yazırsa, daha yeni PostgreSQL client tools quraşdırın.");
}
const mb = (statSync(out).size / 1024 / 1024).toFixed(2);
console.log(`\n✔ Ehtiyat nüsxə hazırdır: ${out} (${mb} MB)\n  Bərpa etmək üçün: npm run db:restore -- "${out}"\n`);
