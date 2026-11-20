import type { Prisma } from "@prisma/client";
import { listingQuerySchema } from "./validators";

export const PAGE_SIZE = 12;

export function buildListingQuery(raw: Record<string, string | string[] | undefined>) {
  const flat: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) flat[k] = Array.isArray(v) ? v[0] : v;
  const parsed = listingQuerySchema.safeParse(flat);
  const f = parsed.success ? parsed.data : listingQuerySchema.parse({});

  const where: Prisma.ListingWhereInput = { status: "PUBLISHED" };
  if (f.q) {
    where.OR = [
      { title: { contains: f.q, mode: "insensitive" } },
      { description: { contains: f.q, mode: "insensitive" } },
      { city: { contains: f.q, mode: "insensitive" } },
    ];
  }
  if (f.category) where.category = { slug: f.category };
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
