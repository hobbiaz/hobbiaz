import { db } from "@/lib/db";
import { route, ok, requireUser, HttpError } from "@/lib/http";
import { orderSchema } from "@/lib/validators";
import { writeLimiter } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email";

const orderInclude = {
  listing: { select: { id: true, images: { take: 1, orderBy: { position: "asc" as const } } } },
  buyer: { select: { id: true, name: true, email: true, phone: true } },
  seller: { select: { id: true, name: true, store: { select: { name: true, slug: true } } } },
};

/** GET /api/orders?role=buyer|seller — my purchases, or orders for my store. */
export const GET = route(async (req) => {
  const u = await requireUser();
  const role = new URL(req.url).searchParams.get("role") === "seller" ? "seller" : "buyer";
  const orders = await db.order.findMany({
    where: role === "seller" ? { sellerId: u.id } : { buyerId: u.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: orderInclude,
  });
  return ok(orders.map((o) => ({
    id: o.id,
    title: o.title,
    price: (o.priceCents / 100).toFixed(2).replace(/\.00$/, ""),
    quantity: o.quantity,
    status: o.status,
    note: o.note,
    createdAt: o.createdAt.toISOString(),
    listingId: o.listingId,
    image: o.listing?.images[0] ? o.listing.images[0].url ?? `/api/media/${o.listing.images[0].storageKey}` : null,
    store: o.seller.store?.name ?? o.seller.name,
    // The seller needs the buyer's contact details to deliver; the buyer sees only the store.
    buyer: role === "seller" ? { name: o.buyer.name, email: o.buyer.email, phone: o.phone ?? o.buyer.phone } : undefined,
  })));
});

/** "Sifariş et": creates an order request and e-mails the seller. */
export const POST = route(async (req) => {
  const u = await requireUser();
  if (!(await writeLimiter.hit(u.id))) throw new HttpError(429, "Çox sürətli. Bir az gözləyin");
  const d = orderSchema.parse(await req.json());
  const l = await db.listing.findUnique({ where: { id: d.listingId }, include: { owner: { select: { id: true, email: true, name: true } } } });
  if (!l || l.status !== "PUBLISHED") throw new HttpError(404, "Elan tapılmadı");
  if (l.ownerId === u.id) throw new HttpError(400, "Öz məhsulunuzu sifariş edə bilməzsiniz");
  const order = await db.order.create({
    data: { listingId: l.id, buyerId: u.id, sellerId: l.ownerId, title: l.title, priceCents: l.priceCents, quantity: d.quantity, phone: d.phone, note: d.note },
  });
  void sendMail({
    to: l.owner.email,
    subject: `Yeni sifariş: ${l.title}`,
    text: `Salam, ${l.owner.name}!\n\n"${l.title}" üçün yeni sifariş var (${d.quantity} əd.).\nSifarişlərinizi hobbi.az profilinizdə "Sifarişlər" bölməsində görə bilərsiniz.`,
  }).catch(() => {});
  return ok({ id: order.id, status: order.status }, 201);
});
