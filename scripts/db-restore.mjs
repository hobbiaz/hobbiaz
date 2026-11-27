// Restores a backup made by `npm run db:backup` into the database in DATABASE_URL / DIRECT_URL.
// Usage:  npm run db:restore -- <file.dump>          (asks for confirmation)
//         npm run db:restore -- <file.dump> --yes    (no question, for scripts)
// Existing tables in the target database are replaced by the ones in the file.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { databaseUrl, describeUrl, fail, findTool, toLibpqUrl } from "./db-url.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) fail("Fayl göstərin: npm run db:restore -- backups/hobbi_az-....dump");
const dump = path.resolve(file);
if (!existsSync(dump)) fail(`Fayl tapılmadı: ${dump}`);

const url = databaseUrl();
const pgRestore = findTool("pg_restore");
const target = describeUrl(url);
console.log(`Fayl:  ${dump}\nBaza:  ${target}\n${pgRestore.version}\n`);

if (!args.includes("--yes")) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`DİQQƏT: "${target}" bazasındakı cədvəllər fayldakılarla əvəz olunacaq.\nDavam etmək üçün "bəli" yazın: `);
  rl.close();
  if (!["bəli", "beli", "yes"].includes(answer.trim().toLocaleLowerCase("az"))) fail("Ləğv edildi, heç nə dəyişmədi.");
}

// --clean --if-exists: drop what the file contains before recreating it;
// --single-transaction: all or nothing (a failed restore leaves the database as it was).
const r = spawnSync(
  pgRestore.path,
  ["--clean", "--if-exists", "--no-owner", "--no-privileges", "--single-transaction", "--exit-on-error", "--dbname", toLibpqUrl(url), dump],
  { stdio: "inherit" },
);
if (r.status !== 0) fail("pg_restore uğursuz oldu; tranzaksiya geri qaytarıldı, baza dəyişmədi.");
console.log("\n✔ Bərpa tamamlandı. Kod bazadan yenidirsə, indi `npm run db:deploy` işlədin.\n");
