import { z } from "zod";

const email = z.string().trim().toLowerCase().email("E-poçt düzgün deyil").max(254);
const password = z
  .string()
  .min(8, "Şifrə ən azı 8 simvol olmalıdır")
  .max(128)
  .regex(/[A-Za-z]/, "Şifrədə hərf olmalıdır")
  .regex(/[0-9]/, "Şifrədə rəqəm olmalıdır");
const azPhone = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Telefon nömrəsi düzgün deyil");

export const STORE_CATEGORIES = ["keramika", "resm", "zergerllik", "toxuculuq", "agac", "musiqi", "digər"] as const;

export const storeCreateSchema = z.object({
  name: z.string().trim().min(4, "Marka adı ən azı 4 simvol olmalıdır").max(40),
  categorySlug: z.enum(STORE_CATEGORIES),
  region: z.string().trim().min(2).max(60).default("Bakı"),
  phone: azPhone.optional(),
});

export const registerSchema = z.object({
  email,
  password,
  /** JWT from /api/auth/otp/verify proving the e-mail was confirmed. */
  verificationToken: z.string().min(10, "E-poçt təsdiqlənməyib"),
  name: z.string().trim().min(2, "Ad ən azı 2 simvol olmalıdır").max(60).optional(),
  store: storeCreateSchema.optional(),
});

export const loginSchema = z.object({
  /** E-mail or store name. `email` is accepted as an alias. */
  identity: z.string().trim().min(1, "E-poçt və ya mağaza adını daxil edin").max(254).optional(),
  email: z.string().trim().max(254).optional(),
  password: z.string().min(1, "Şifrəni daxil edin").max(128),
}).refine((d) => d.identity || d.email, { message: "E-poçt və ya mağaza adını daxil edin" });

export const otpRequestSchema = z.object({ email, purpose: z.enum(["SIGNUP", "RESET"]) });
export const otpVerifySchema = z.object({ email, purpose: z.enum(["SIGNUP", "RESET"]), code: z.string().regex(/^\d{6}$/, "6 rəqəmli kod daxil edin") });
export const passwordResetSchema = z.object({ email, code: z.string().regex(/^\d{6}$/, "6 rəqəmli kod daxil edin"), password });

const optionalUrl = z.string().trim().url("Link düzgün deyil").max(300).optional().nullable().or(z.literal("").transform(() => null));
export const storeUpdateSchema = z.object({
  region: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(500).optional().nullable(),
  phone: azPhone.optional().nullable().or(z.literal("").transform(() => null)),
  avatarKey: z.string().regex(/^[a-f0-9]{32}\.(jpg|png|webp)$/).optional(),
  instagram: optionalUrl,
  tiktok: optionalUrl,
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).default(5),
  body: z.string().trim().min(2, "Rəy yazın").max(1000),
});
export const reviewReplySchema = z.object({ reply: z.string().trim().min(1).max(1000) });

export const orderSchema = z.object({
  listingId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  phone: azPhone.optional(),
  note: z.string().trim().max(1000).optional(),
});
export const orderUpdateSchema = z.object({ status: z.enum(["ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"]) });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Ad ən azı 2 simvol olmalıdır").max(60),
  phone: z.string().trim().max(30).optional().nullable(),
  city: z.string().trim().max(60).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
});

const imageKey = z.string().regex(/^[a-f0-9]{32}\.(jpg|png|webp)$/, "Şəkil açarı yanlışdır");

export const listingSchema = z.object({
  title: z.string().trim().min(3, "Başlıq ən azı 3 simvol olmalıdır").max(120),
  description: z.string().trim().min(10, "Təsvir ən azı 10 simvol olmalıdır").max(5000),
  priceAzn: z.coerce.number().min(0, "Qiymət mənfi ola bilməz").max(1_000_000),
  oldPriceAzn: z.coerce.number().min(0).max(1_000_000).optional().nullable(),
  phone: azPhone.optional().nullable(),
  categorySlug: z.string().min(1, "Kateqoriya seçin"),
  condition: z.enum(["NEW", "USED", "HANDMADE"]).default("NEW"),
  city: z.string().trim().min(2, "Şəhər daxil edin").max(60),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  // duplicates are dropped so the same upload is never attached twice
  images: z.array(imageKey).max(8).default([]).transform((keys) => [...new Set(keys)]),
});
export const listingUpdateSchema = listingSchema.partial();

export const reportSchema = z.object({
  listingId: z.string().min(1),
  reason: z.enum(["SPAM", "FRAUD", "PROHIBITED", "OFFENSIVE", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

export const moderationSchema = z.object({
  action: z.enum(["remove", "restore"]),
  reason: z.string().trim().max(500).optional(),
});

export const newConversationSchema = z.object({
  recipientId: z.string().min(1),
  listingId: z.string().min(1).optional(),
  body: z.string().trim().min(1).max(2000),
});
export const messageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
export const commentSchema = z.object({ body: z.string().trim().min(1).max(500) });

export const listingQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().max(60).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  sort: z.enum(["new", "price_asc", "price_desc"]).default("new"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  discount: z.enum(["1"]).optional(),
  owner: z.string().max(60).optional(),
  ids: z.string().max(2000).optional(),
});

/** "Kolleksiya yarat": a title and 8–20 distinct listings. */
export const collectionSchema = z.object({
  title: z.string().trim().min(2, "Kolleksiyaya ad verin (ən azı 2 simvol)").max(60, "Ad çox uzundur (maks. 60 simvol)"),
  listingIds: z.array(z.string().min(1).max(64))
    .min(8, "Ən azı 8 məhsul seçin")
    .max(20, "Ən çox 20 məhsul seçmək olar")
    .refine((ids) => new Set(ids).size === ids.length, "Eyni məhsul iki dəfə seçilib"),
});

/** Step 1 of a reel upload: what the browser is about to send. */
export const reelUploadSchema = z.object({
  mime: z.enum(["video/mp4", "video/webm", "video/quicktime"], { errorMap: () => ({ message: "Yalnız MP4, WebM və MOV videoları qəbul edilir" }) }),
  size: z.number().int().positive().max(100 * 1024 * 1024, "Video 100 MB-dan böyükdür"),
});
/** Step 3: publish the uploaded file as a reel. */
export const reelCreateSchema = z.object({
  key: z.string().regex(/^[a-f0-9]{32}\.(mp4|webm|mov)$/, "Fayl tapılmadı"),
  title: z.string().trim().min(2, "Videoya qısa ad yazın").max(120, "Ad çox uzundur (maks. 120 simvol)"),
});
