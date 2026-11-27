import type { Prisma } from "@prisma/client";
import { listingQuerySchema } from "./validators";

export const PAGE_SIZE = 24;

export function buildListingQuery(raw: Record<string, string | string[] | undefined>) {
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) flat[k] = Array.isArray(v) ? v[0] : v;
  const parsed = listingQuerySchema.safeParse(flat);
  const f = parsed.success ? parsed.data : listingQuerySchema.parse({});

  const where: Prisma.ListingWhereInput = { status: "PUBLISHED" };
  // Every word must match somewhere (title, description, city or store name).
  const words = (f.q ?? "").split(/\s+/).filter(Boolean).slice(0, 6);
  if (words.length) {
    where.AND = words.map((w) => ({
      OR: [
        { title: { contains: w, mode: "insensitive" } },
        { description: { contains: w, mode: "insensitive" } },
        { city: { contains: w, mode: "insensitive" } },
        { owner: { store: { name: { contains: w, mode: "insensitive" } } } },
      ],
    }));
  }
  if (f.category && f.category !== "all") where.category = { slug: f.category };
  if (f.discount) where.oldPriceCents = { not: null };
  if (f.ids) where.id = { in: f.ids.split(",").filter(Boolean).slice(0, 100) };
  if (f.min !== undefined || f.max !== undefined) {
    where.priceCents = {
      ...(f.min !== undefined ? { gte: Math.round(f.min * 100) } : {}),
      ...(f.max !== undefined ? { lte: Math.round(f.max * 100) } : {}),
    };
  }
  const orderBy: Prisma.ListingOrderByWithRelationInput =
    f.sort === "price_asc" ? { priceCents: "asc" } : f.sort === "price_desc" ? { priceCents: "desc" } : { createdAt: "desc" };
  return { filters: f, where, orderBy, skip: (f.page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}
