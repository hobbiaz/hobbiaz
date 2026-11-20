/** Next.js calls this once when the server starts. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { checkEnv } = await import("./lib/env");
  const report = checkEnv();
  for (const w of report.warnings) console.warn(`[env] ${w}`);
  if (!report.ok) console.error(`[env] Çatışmayan mühit dəyişənləri: ${report.missing.join(", ")} — .env.example-a baxın`);
}
