import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PRODUCTS } from "../src/data/products";
import { slugify } from "../src/lib/slug";

const db = new PrismaClient();

// Same slugs as the UI (src/types CategorySlug), so ?cat= filters map 1:1 to the DB.
const CATEGORIES = [
  ["keramika", "Keramika"], ["zergerllik", "Zərgərlik"], ["resm", "Rəsm"],
  ["toxuculuq", "Toxuculuq və xalçaçılıq"], ["agac", "Ağac işi"], ["musiqi", "Musiqi alətləri"],
  ["digər", "Digər"],
] as const;

const REGIONS = ["Bakı", "Gəncə", "Şəki", "Sumqayıt", "Quba", "Lənkəran"];

async function main() {
  for (const [slug, name] of CATEGORIES)
    await db.category.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  const pw = process.env.SEED_DEMO_PASSWORD;
  if (!pw || pw.length < 8) throw new Error("Set SEED_DEMO_PASSWORD (8+ chars) to seed demo data");
  const passwordHash = await bcrypt.hash(pw, 12);

  // A demo buyer for trying orders, reviews and messages.
  await db.user.upsert({
    where: { email: "demo-alici@demo.hobbi.invalid" }, update: {},
    create: { email: "demo-alici@demo.hobbi.invalid", name: "[DEMO] Alıcı", role: "BUYER", passwordHash, isDemo: true, emailVerifiedAt: new Date() },
  });

  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
    await db.user.upsert({
      where: { email }, update: { role: "ADMIN" },
      create: { email, name: "Admin", role: "ADMIN", passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12), emailVerifiedAt: new Date() },
    });
  }

  // The prototype's catalogue becomes real listings, one demo store per shop name.
  if ((await db.listing.count({ where: { isDemo: true } })) === 0) {
    const shops = [...new Set(PRODUCTS.map((p) => p.shop))];
    const owners: Record<string, string> = {};
    for (const [i, shop] of shops.entries()) {
      const slug = slugify(shop);
      const first = PRODUCTS.find((p) => p.shop === shop)!;
      const owner = await db.user.upsert({
        where: { email: `demo-${slug}@demo.hobbi.invalid` }, update: {},
        create: {
          email: `demo-${slug}@demo.hobbi.invalid`, name: shop, role: "SELLER", passwordHash, isDemo: true, emailVerifiedAt: new Date(),
          phone: first.phone, city: REGIONS[i % REGIONS.length],
          store: { create: { name: shop, slug, categorySlug: first.cat === "all" ? "digər" : first.cat, region: REGIONS[i % REGIONS.length], phone: first.phone, isDemo: true, bio: `${shop}: əl işi məhsullar (demo mağaza).` } },
        },
      });
      owners[shop] = owner.id;
    }
    for (const [i, p] of PRODUCTS.entries()) {
      await db.listing.create({
        data: {
          ownerId: owners[p.shop], categoryId: cats[p.cat === "all" ? "digər" : p.cat], title: p.title, description: p.desc,
          priceCents: Math.round(Number(p.price) * 100), oldPriceCents: p.oldPrice ? Math.round(Number(p.oldPrice) * 100) : null,
          phone: p.phone, condition: "HANDMADE", city: REGIONS[i % REGIONS.length], status: "PUBLISHED", isDemo: true,
          // stagger creation times so "new first" has a stable order
          createdAt: new Date(Date.now() - i * 3_600_000),
          images: { create: (p.images.length ? p.images : [p.photo]).map((url, position) => ({ url, position })) },
        },
      });
    }
    console.log(`Seeded ${shops.length} demo stores and ${PRODUCTS.length} listings`);
  }

  // No video ships with the repo: a demo reel is created only when a URL is given.
  const reelUrl = process.env.SEED_DEMO_REEL_URL;
  const anyDemoSeller = await db.user.findFirst({ where: { isDemo: true, role: "SELLER" } });
  if (reelUrl && anyDemoSeller && (await db.reel.count({ where: { isDemo: true } })) === 0)
    await db.reel.create({ data: { ownerId: anyDemoSeller.id, title: "[DEMO] Saxsı hazırlanması", videoUrl: reelUrl, isDemo: true } });
}
main().then(() => db.$disconnect()).catch(async (e) => { console.error(e); await db.$disconnect(); process.exit(1); });
