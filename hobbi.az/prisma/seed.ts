import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Same slugs as the UI (src/types CategorySlug), so ?cat= filters map 1:1 to the DB.
const CATEGORIES = [
  ["keramika", "Keramika"], ["zergerllik", "Zərgərlik"], ["resm", "Rəsm"],
  ["toxuculuq", "Toxuculuq və xalçaçılıq"], ["agac", "Ağac işi"], ["musiqi", "Musiqi alətləri"],
  ["digər", "Digər"],
] as const;

async function main() {
  for (const [slug, name] of CATEGORIES)
    await db.category.upsert({ where: { slug }, update: { name }, create: { slug, name } });

  const pw = process.env.SEED_DEMO_PASSWORD;
  if (!pw || pw.length < 8) throw new Error("Set SEED_DEMO_PASSWORD (8+ chars) to seed demo data");
  const passwordHash = await bcrypt.hash(pw, 12);

  const seller = await db.user.upsert({
    where: { email: "demo-satici@demo.hobbi.invalid" }, update: {},
    create: { email: "demo-satici@demo.hobbi.invalid", name: "[DEMO] Satıcı", role: "SELLER", city: "Bakı", passwordHash, isDemo: true },
  });
  await db.user.upsert({
    where: { email: "demo-alici@demo.hobbi.invalid" }, update: {},
    create: { email: "demo-alici@demo.hobbi.invalid", name: "[DEMO] Alıcı", role: "BUYER", passwordHash, isDemo: true },
  });

  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    await db.user.upsert({
      where: { email: process.env.SEED_ADMIN_EMAIL.toLowerCase() }, update: {},
      create: { email: process.env.SEED_ADMIN_EMAIL.toLowerCase(), name: "Admin", role: "ADMIN", passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12) },
    });
  }

  if ((await db.listing.count({ where: { isDemo: true } })) === 0) {
    const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));
    const demo = [
      ["[DEMO] Əl işi saxsı güldan", "keramika", 4500, "HANDMADE", "Bakı"],
      ["[DEMO] Yağlı boya mənzərə", "resm", 12000, "NEW", "Gəncə"],
      ["[DEMO] Gümüş sırğa", "zergerllik", 6500, "HANDMADE", "Şəki"],
      ["[DEMO] Toxunma xalça", "toxuculuq", 30000, "HANDMADE", "Quba"],
      ["[DEMO] Oyma taxta qutu", "agac", 3000, "HANDMADE", "Bakı"],
      ["[DEMO] İkinci əl tar", "musiqi", 25000, "USED", "Sumqayıt"],
    ] as const;
    for (const [title, cat, priceCents, condition, city] of demo)
      await db.listing.create({ data: { title, description: "Demo elan. Real məhsul deyil.", categoryId: cats[cat], priceCents, condition, city, status: "PUBLISHED", ownerId: seller.id, isDemo: true } });
  }
  // No video ships with the repo: a demo reel is created only when a URL is given.
  const reelUrl = process.env.SEED_DEMO_REEL_URL;
  if (reelUrl && (await db.reel.count({ where: { isDemo: true } })) === 0)
    await db.reel.create({ data: { ownerId: seller.id, title: "[DEMO] Saxsı hazırlanması", videoUrl: reelUrl, isDemo: true } });
}
main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
