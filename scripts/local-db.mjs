// Local PostgreSQL for development — no Docker or installer needed.
// Usage:  npm run db:local   (keep this terminal open; Ctrl+C stops the database)
// Data lives in .local-db/ (git-ignored). Matches DATABASE_URL in .env.example's local block.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../.local-db", import.meta.url));
const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "hobbi",
  password: "hobbi_local_dev",
  port: 5433,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

if (!existsSync(dir)) {
  console.log("Creating local database in .local-db/ …");
  await pg.initialise();
}
await pg.start();
try { await pg.createDatabase("hobbi_az"); } catch { /* already exists */ }
console.log("\n✔ PostgreSQL is running on localhost:5433 (db: hobbi_az). Ctrl+C to stop.\n");

const stop = async () => { await pg.stop(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
