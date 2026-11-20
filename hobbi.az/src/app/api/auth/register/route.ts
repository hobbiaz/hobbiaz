import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { route, ok, HttpError, isUniqueViolation } from "@/lib/http";
import { registerSchema } from "@/lib/validators";
import { readVerificationToken } from "@/lib/otp";
import { slugify } from "@/lib/slug";
import { clientIp, registerLimiter } from "@/lib/rate-limit";

/** Creates the account (and the store, for sellers) after the e-mail was verified by OTP. */
export const POST = route(async (req) => {
  if (!(await registerLimiter.hit(clientIp(req)))) throw new HttpError(429, "Çox sayda qeydiyyat cəhdi. Bir az sonra yenidən yoxlayın");
  const d = registerSchema.parse(await req.json());
  const verified = await readVerificationToken(d.verificationToken, "SIGNUP");
  if (verified !== d.email) throw new HttpError(400, "E-poçt təsdiqlənməyib və ya kodun vaxtı bitib");
  if (await db.user.findUnique({ where: { email: d.email }, select: { id: true } }))
    throw new HttpError(409, "Bu e-poçt artıq qeydiyyatdan keçib");

  const name = d.name ?? d.store?.name ?? d.email.split("@")[0];
  try {
    const user = await db.user.create({
      data: {
        name,
        email: d.email,
        role: d.store ? "SELLER" : "BUYER",
        passwordHash: await hashPassword(d.password),
        emailVerifiedAt: new Date(),
        phone: d.store?.phone,
        city: d.store?.region,
        store: d.store
          ? { create: { name: d.store.name, slug: await uniqueSlug(d.store.name), categorySlug: d.store.categorySlug, region: d.store.region, phone: d.store.phone } }
          : undefined,
      },
      select: { id: true, name: true, role: true },
    });
    await createSession(user.id);
    return ok(user, 201);
  } catch (e) {
    if (isUniqueViolation(e)) throw new HttpError(409, "Bu marka adı artıq tutulub");
    throw e;
  }
});

async function uniqueSlug(name: string) {
  const base = slugify(name);
  for (let i = 0; i < 20; i++) {
    const slug = i ? `${base}-${i + 1}` : base;
    if (!(await db.store.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}
